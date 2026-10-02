<?php
/**
 * Alurforma — réception des demandes du formulaire Contact (hébergement OVH, PHP 8).
 *
 * Contrat : docs/contact-api.md. Ce script :
 *  - n'accepte que POST JSON depuis le site lui-même ;
 *  - revalide et normalise chaque champ (le navigateur n'est pas une source de confiance) ;
 *  - limite la fréquence par IP et par e-mail ;
 *  - dédoublonne grâce à request_id (Idempotency-Key) ;
 *  - ré-horodate côté serveur, y compris la preuve de demande de rappel ;
 *  - enregistre la demande (JSON Lines, hors du web public) PUIS prévient par e-mail ;
 *  - ne répond 200 que si la demande est réellement enregistrée.
 */

declare(strict_types=1);

// ------------------------------------------------------------ réglages
const NOTIFY_TO = 'contact@alurforma.fr';
const NOTIFY_FROM = 'noreply@alurforma.fr';
const ALLOWED_HOSTS = ['alurforma.fr', 'www.alurforma.fr'];
const MAX_BODY = 32768;
const RATE_IP = [5, 600];      // 5 demandes / 10 min par IP
const RATE_EMAIL = [3, 3600];  // 3 demandes / heure par e-mail
const RETENTION_MONTHS = 36;   // durée de conservation des demandes (à valider, cf. politique de confidentialité)

/** Dossier de stockage : hors de « www » si possible, sinon api/_data (protégé par .htaccess). */
function storage_dir(): string
{
    $candidates = [dirname(__DIR__, 2) . '/alurforma-data', __DIR__ . '/_data'];
    foreach ($candidates as $dir) {
        if (is_dir($dir) || @mkdir($dir, 0700, true)) {
            if (is_writable($dir)) return $dir;
        }
    }
    respond(500, ['error' => 'storage']);
}

// --------------------------------------------------------------- helpers
function respond(int $status, array $body): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Texte nettoyé : espaces, caractères de contrôle, longueur maximale. */
function clean(mixed $v, int $max, bool $multiline = false): ?string
{
    if (!is_string($v)) return null;
    $v = $multiline ? preg_replace('/[^\P{C}\n]/u', '', str_replace("\r\n", "\n", $v)) : preg_replace('/\p{C}/u', '', $v);
    $v = trim((string) $v);
    if ($v === '') return null;
    return mb_substr($v, 0, $max);
}

function enum_val(mixed $v, array $allowed): ?string
{
    return is_string($v) && in_array($v, $allowed, true) ? $v : null;
}

function str_list(mixed $v, array $allowed): array
{
    if (!is_array($v)) return [];
    return array_values(array_unique(array_filter($v, fn($x) => is_string($x) && in_array($x, $allowed, true))));
}

/** Fenêtre glissante simple, stockée en fichier (suffisant pour ce volume). */
function rate_limited(string $dir, string $key, array $rule): bool
{
    [$max, $window] = $rule;
    $file = $dir . '/rate-' . hash('sha256', $key) . '.json';
    $now = time();
    $fh = fopen($file, 'c+');
    if (!$fh) return false;
    flock($fh, LOCK_EX);
    $hits = json_decode((string) stream_get_contents($fh), true);
    $hits = array_filter(is_array($hits) ? $hits : [], fn($t) => is_int($t) && $t > $now - $window);
    $limited = count($hits) >= $max;
    if (!$limited) $hits[] = $now;
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode(array_values($hits)));
    flock($fh, LOCK_UN);
    fclose($fh);
    return $limited;
}

// ------------------------------------------------------------ contrôles
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['error' => 'method']);
}
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) respond(415, ['error' => 'content-type']);

// Même origine uniquement (le formulaire est sur le site).
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$originHost = $origin ? parse_url($origin, PHP_URL_HOST) : null;
if ($originHost !== null && !in_array($originHost, ALLOWED_HOSTS, true)) respond(403, ['error' => 'origin']);

$raw = file_get_contents('php://input', false, null, 0, MAX_BODY + 1);
if ($raw === false || strlen($raw) > MAX_BODY) respond(413, ['error' => 'size']);
$in = json_decode($raw, true);
if (!is_array($in)) respond(400, ['error' => 'json']);

// ------------------------------------------------------------ validation
$types = ['formation', 'formation_course', 'pack', 'custom_pack', 'card_waitlist', 'entreprise', 'financement', 'autre'];
$requestId = is_string($in['request_id'] ?? null) && preg_match('/^[A-Za-z0-9-]{8,64}$/', $in['request_id']) ? $in['request_id'] : null;
$type = enum_val($in['request_type'] ?? null, $types);
$name = clean($in['name'] ?? null, 120);
$email = clean($in['email'] ?? null, 160);
$email = $email ? mb_strtolower($email) : null;

$errors = [];
if (!$requestId) $errors[] = 'request_id';
if (!$type) $errors[] = 'request_type';
if (!$name) $errors[] = 'name';
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'email';

$phone = clean($in['phone'] ?? null, 30);
if ($phone !== null && !preg_match('/^[0-9 +().\-]{6,30}$/', $phone)) $errors[] = 'phone';
$callback = ($in['callback_requested'] ?? false) === true;
if ($callback && !$phone) $errors[] = 'phone';

$company = clean($in['company'] ?? null, 160);
if ($type === 'entreprise' && !$company) $errors[] = 'company';
$message = clean($in['message'] ?? null, 3000, true);
if ($type === 'autre' && !$message) $errors[] = 'message';

if ($errors) respond(422, ['error' => 'validation', 'fields' => array_values(array_unique($errors))]);

// ---------------------------------------------------------------- limites
$dir = storage_dir();
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$ipHash = hash('sha256', $ip . '|' . date('Y-m')); // pseudonymisé, renouvelé chaque mois

// Idempotence : une même demande renvoyée reçoit la même référence.
$idFile = $dir . '/ids.json';
$ids = is_file($idFile) ? (json_decode((string) file_get_contents($idFile), true) ?: []) : [];
if (isset($ids[$requestId])) respond(200, ['reference' => $ids[$requestId], 'duplicate' => true]);

if (rate_limited($dir, 'ip|' . $ipHash, RATE_IP) || rate_limited($dir, 'mail|' . $email, RATE_EMAIL)) {
    respond(429, ['error' => 'rate']);
}

// ------------------------------------------------------- enregistrement
$now = (new DateTimeImmutable('now', new DateTimeZone('Europe/Paris')))->format(DATE_ATOM);
$reference = 'AF-' . date('ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));
$summary = clean($in['summary'] ?? null, 300) ?? $type;

$record = [
    'reference' => $reference,
    'request_id' => $requestId,
    'received_at' => $now,
    'request_type' => $type,
    // Jamais déduit du domaine de l'e-mail : seulement du parcours choisi.
    'contact_type' => enum_val($in['contact_type'] ?? null, ['consumer', 'professional', 'unknown']) ?? 'unknown',
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'company' => $company,
    'professional_card' => str_list($in['professional_card'] ?? null, ['T', 'G', 'S']),
    'renewal_date' => clean($in['renewal_date'] ?? null, 40),
    'need' => clean($in['need'] ?? null, 120),
    'course_codes' => array_values(array_filter(is_array($in['course_codes'] ?? null) ? $in['course_codes'] : [], fn($c) => is_string($c) && preg_match('/^F\d{2}$/', $c))),
    'pack' => is_string($in['pack'] ?? null) && preg_match('/^(pack|sur-mesure)-\d{1,3}$/', $in['pack']) ? $in['pack'] : null,
    'funding_status' => clean($in['funding_status'] ?? null, 60),
    'funding_body_known' => enum_val($in['funding_body_known'] ?? null, ['oui', 'non', 'ne-sait-pas']),
    'funding_body' => clean($in['funding_body'] ?? null, 120),
    'team_size' => clean($in['team_size'] ?? null, 20),
    'subject' => clean($in['subject'] ?? null, 140),
    'message' => $message,
    'summary' => $summary,
    'source_page' => clean($in['source_page'] ?? null, 40),
    'source_url' => clean($in['source_url'] ?? null, 500),
    'source_referrer' => clean($in['source_referrer'] ?? null, 300),
    'client_created_at' => clean($in['created_at'] ?? null, 40),
    // Demande de rappel : limitée à cette demande, preuve horodatée côté serveur.
    'callback_requested' => $callback,
    'callback_requested_at' => $callback ? $now : null,
    'callback_scope' => $callback ? $summary : null,
    'callback_proof_text' => $callback ? clean($in['callback_proof_text'] ?? null, 300) : null,
    'callback_phone' => $callback ? $phone : null,
    'marketing_phone_consent' => false, // non collecté sur ce formulaire
    'privacy_notice_version' => clean($in['privacy_notice_version'] ?? null, 40),
    'ip_hash' => $ipHash,
    'user_agent' => clean($_SERVER['HTTP_USER_AGENT'] ?? null, 300),
];

// Purge : les fichiers mensuels plus anciens que la durée de conservation sont supprimés.
$limit = date('Y-m', strtotime('-' . RETENTION_MONTHS . ' months'));
foreach (glob($dir . '/demandes-*.jsonl') ?: [] as $old) {
    if (substr(basename($old, '.jsonl'), 9) < $limit) @unlink($old);
}

$line = json_encode($record, JSON_UNESCAPED_UNICODE) . "\n";
$file = $dir . '/demandes-' . date('Y-m') . '.jsonl';
if (@file_put_contents($file, $line, FILE_APPEND | LOCK_EX) === false) respond(500, ['error' => 'storage']);
@chmod($file, 0600);

$ids[$requestId] = $reference;
if (count($ids) > 5000) $ids = array_slice($ids, -5000, null, true);
@file_put_contents($idFile, json_encode($ids), LOCK_EX);

// ------------------------------------------------------------ notification
$lines = [
    "Nouvelle demande Alurforma — {$reference}",
    '',
    "Objet : {$summary}",
    "Nom : {$name}",
    "E-mail : {$email}",
];
foreach (['phone' => 'Téléphone', 'company' => 'Entreprise', 'need' => 'Besoin', 'renewal_date' => 'Échéance', 'team_size' => 'Effectif', 'funding_status' => 'Situation', 'funding_body_known' => 'Financeur connu', 'funding_body' => 'Financeur', 'subject' => 'Objet saisi'] as $k => $label) {
    if (!empty($record[$k])) $lines[] = "{$label} : {$record[$k]}";
}
if ($record['professional_card']) $lines[] = 'Carte(s) : ' . implode(', ', $record['professional_card']);
if ($record['course_codes']) $lines[] = 'Formation(s) : ' . implode(', ', $record['course_codes']);
if ($record['pack']) $lines[] = "Pack : {$record['pack']}";
if ($message) array_push($lines, '', $message);
$lines[] = '';
$lines[] = $callback
    ? "RAPPEL DEMANDÉ le {$now} au {$phone}, uniquement pour : {$summary}\nTexte coché : « {$record['callback_proof_text']} »"
    : 'Pas de demande de rappel (ne pas appeler à des fins commerciales).';
$lines[] = "Source : {$record['source_url']}";

$subject = '=?UTF-8?B?' . base64_encode("[Alurforma] {$reference} — {$summary}") . '?=';
$headers = [
    'From: Alurforma <' . NOTIFY_FROM . '>',
    // L'e-mail visiteur a été validé (filter_var) : pas d'injection d'en-tête possible.
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];
// La demande est déjà enregistrée : un échec d'envoi ne la fait pas perdre.
@mail(NOTIFY_TO, $subject, implode("\n", $lines), implode("\r\n", $headers), '-f' . NOTIFY_FROM);

respond(200, ['reference' => $reference]);

# Formulaire Contact — contrat d’API

La page Contact envoie chaque demande en JSON à `CONFIG.formEndpoint` (`src/config.ts`).
Tant que ce champ vaut `null`, le formulaire ouvre un e-mail pré-rempli vers `CONFIG.email`.
Il l’annonce au visiteur et n’affiche jamais « demande reçue ».

## Mise en service sur OVH (hébergement web)

L’endpoint est fourni : `public/api/contact.php` (PHP 8, aucune dépendance), copié dans `dist/api/` au build.

1. `npm run build`, puis envoyer **tout le contenu de `dist/`** dans le dossier racine du site (en général `www/`) par FTP/SFTP.
   Cela comprend les fichiers cachés `.htaccess` et `.ovhconfig` (PHP 8.3).
2. Les demandes sont enregistrées dans `alurforma-data/`, **à côté** de `www/`, donc hors du web public.
   Si ce dossier ne peut pas être créé, elles vont dans `www/api/_data/`, dont l’accès est bloqué par `api/.htaccess`.
   Une ligne JSON par demande, un fichier par mois. Les fichiers de plus de 36 mois sont supprimés automatiquement (`RETENTION_MONTHS`).
3. Chaque demande est aussi envoyée par e-mail à `contact@alurforma.fr`, avec sa référence et l’éventuelle demande de rappel.
   L’envoi passe par la fonction `mail()` d’OVH avec l’expéditeur `noreply@alurforma.fr`. Les e-mails du domaine étant gérés par Google Workspace, ajouter OVH à l’enregistrement SPF du domaine (`include:mx.ovh.com`) pour que ces notifications n’arrivent pas en indésirables.
4. Le formulaire n’utilise l’endpoint que sur `alurforma.fr` / `www.alurforma.fr` (`formEndpointHosts`). Partout ailleurs (aperçus), il reste en mode e-mail pré-rempli.
5. Même origine : la CSP `connect-src 'self'` suffit.
6. Vérifier la politique de confidentialité :
   - bases juridiques ;
   - durées de conservation ;
   - destinataires et sous-traitants ;
   - demande de rappel.

   Mettre ensuite à jour `privacyNoticeVersion`.

## Requête

`POST <formEndpoint>`

En-têtes : `Content-Type: application/json` et `Idempotency-Key: <request_id>`.
Le même `request_id` est renvoyé si le visiteur réessaie après un échec. Le serveur doit dédoublonner.

| Champ | Type | Notes |
|---|---|---|
| `request_id` | string | UUID généré côté navigateur, sert à l’idempotence |
| `request_type` | enum | `formation`, `formation_course`, `pack`, `custom_pack`, `card_waitlist`, `entreprise`, `financement`, `autre` |
| `contact_type` | enum | `professional` (parcours Entreprise, ou Financement « entreprise ») sinon `unknown`. **Jamais déduit du domaine de l’e-mail.** |
| `name`, `email` | string | obligatoires |
| `phone`, `company` | string \| null | |
| `professional_card` | string[] | `T`, `G`, `S` |
| `renewal_date` | string \| null | texte libre (« mars 2027 ») |
| `need` | string \| null | besoin choisi (particulier ou entreprise) |
| `course_codes` | string[] | ex. `["F02"]` |
| `pack` | string \| null | `pack-14`, `pack-28`, `pack-42`, `sur-mesure-<h>` |
| `funding_status` | string \| null | Salarié / Indépendant / Entreprise |
| `funding_body_known` | string \| null | `oui`, `non`, `ne-sait-pas` |
| `funding_body` | string \| null | nom saisi |
| `team_size` | string \| null | tranche (entreprise) ou nombre (financement) |
| `subject`, `message` | string \| null | |
| `summary` | string | objet lisible de la demande |
| `source_page`, `source_url`, `source_referrer` | string | contexte d’origine (même site uniquement pour le référent) |
| `created_at` | ISO 8601 | heure du navigateur, **à ré-horodater côté serveur** |
| `callback_requested` | boolean | case « Je souhaite être rappelé… », non pré-cochée |
| `callback_requested_at` | ISO 8601 \| null | à ré-horodater côté serveur |
| `callback_scope` | string \| null | = `summary` : l’appel est limité à cette demande |
| `callback_proof_text` | string \| null | texte exact de la case affichée au visiteur |
| `privacy_notice_version` | string | version de la notice affichée sous le bouton |

## Téléphone et consentement

- Renseigner un numéro **n’autorise pas** la prospection téléphonique.
- `callback_requested = true` : une demande de rappel limitée à l’objet `callback_scope`. Ce n’est jamais une autorisation d’appels commerciaux ultérieurs.
- Le serveur conserve la preuve :
  - `callback_requested_at` ;
  - `callback_proof_text` ;
  - le numéro ;
  - `summary` ;
  - `source_url` ;
  - `request_id`.
- Aucun consentement à la prospection téléphonique future n’est collecté. Si cette case est ajoutée un jour, elle doit être :
  - séparée et facultative ;
  - non pré-cochée ;
  - validée juridiquement ;
  - transmise avec son texte, sa date et sa durée (`marketing_phone_consent*`).

## Réponse

- `2xx` : la demande est enregistrée. Corps facultatif `{ "reference": "AF-XXXXXX" }`. La référence n’est affichée que si elle est renvoyée.
- Tout autre statut, ou un délai de plus de 15 s : le visiteur voit « L’envoi n’a pas abouti » et un lien e-mail de secours.

## Ce que fait le serveur (`contact.php`)

Tout ce qui suit est implémenté et testé (PHP 8.4, `php -S`) :
- `405` hors POST ;
- `415` hors JSON ;
- `403` si l’origine n’est pas le site ;
- `413` au-delà de 32 Ko ;
- `422` avec la liste des champs invalides ;
- `429` au-delà de 5 demandes / 10 min par IP ou de 3 demandes / heure par e-mail ;
- `200 { reference }` uniquement après enregistrement ;
- un `request_id` déjà vu renvoie la même référence.

### Contrôles côté serveur

- Revalider tous les champs. Le navigateur n’est jamais une source de confiance.
- Limiter les tailles : nom 120, e-mail 160, message 3000 caractères…
- Normaliser les données : supprimer les espaces superflus, mettre l’e-mail en minuscules.
- Limiter la fréquence des envois par IP et par e-mail.
- Ignorer les requêtes dont le champ piège `website` serait rempli : il n’est pas envoyé par le navigateur, mais un robot peut appeler l’API directement.
- Ne placer aucune clé secrète dans le front-end.

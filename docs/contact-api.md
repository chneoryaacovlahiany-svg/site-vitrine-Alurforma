# Formulaire Contact — contrat d’API

La page Contact envoie chaque demande en JSON à `CONFIG.formEndpoint` (`src/config.ts`).
Tant que ce champ vaut `null`, le formulaire ouvre un e-mail pré-rempli vers `CONFIG.email`.
Il l’annonce au visiteur et n’affiche jamais « demande reçue ».

## Mise en service

1. Créer l’endpoint (fonction serveur Netlify / Vercel, CRM, etc.) et renseigner `formEndpoint`.
2. Autoriser son domaine dans la CSP : `connect-src` dans `public/_headers` **et** `vercel.json`.
3. Vérifier la politique de confidentialité :
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

## À faire côté serveur

- Revalider tous les champs. Le navigateur n’est jamais une source de confiance.
- Limiter les tailles : nom 120, e-mail 160, message 3000 caractères…
- Normaliser les données : supprimer les espaces superflus, mettre l’e-mail en minuscules.
- Limiter la fréquence des envois par IP et par e-mail.
- Ignorer les requêtes dont le champ piège `website` serait rempli : il n’est pas envoyé par le navigateur, mais un robot peut appeler l’API directement.
- Ne placer aucune clé secrète dans le front-end.

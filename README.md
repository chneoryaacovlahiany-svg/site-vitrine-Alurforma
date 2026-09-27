# Alurforma — site vitrine

Site vitrine de la formation continue loi ALUR (cartes T, G, S) d’**Alurforma**, marque déposée de **SUMMITWISE** (SIRET 944 811 819 00019, déclaration d’activité n° 11922912592).

Signature : *Comprendre la règle. Sécuriser la pratique.*

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build de production dans dist/
npm run preview    # sert dist/
```

## Pages (onglets)

| Page | Contenu | Animation |
|---|---|---|
| `index.html` — Accueil | Hero vidéo (la porte du générique s’ouvre), aperçu LMS, repères, formules, cartes T/G/S, formateurs, 4 étapes, cadre réglementaire, film de marque en fenêtre | Séquence **3D** laptop → smartphone → attestation SPÉCIMEN, pilotée au scroll |
| `formations.html` | Onglet **Formations individuelles** : catalogue filtrable (recherche, carte, thème, thèmes exigés) et fiche détaillée par formation (`formations.html#f01`). Onglet **Packs** : packs 14 / 28 / 42 h ou **Composer mon pack** (cumul d’heures, contrôle déontologie / non-discrimination, devis prérempli). Configurateur. | Film « de la formation au cycle complet » |
| `entreprises.html` | Offre agences et réseaux : suivi par collaborateur, chaîne de preuve, devis | Film « tableau de pilotage d’agence » |
| `financement.html` | Pistes par statut, documents fournis, aucune promesse | Film « de votre statut à la décision » |
| `faq.html` | Questions par thème | — |
| `contact.html` | Identité de l’organisme, formulaire | — |
| Pages légales | Mentions légales, CGV, confidentialité, accessibilité, réclamations | — |

L’en-tête et le pied de page sont communs (`partials/*.html`) et injectés **au moment du build** par un plugin Vite : chaque page est livrée en HTML complet, donc indexable. Le lien de la page courante reçoit `aria-current="page"`.

## Architecture

| Fichier | Rôle |
|---|---|
| `partials/header.html`, `footer.html` | Navigation, logo officiel, mentions SUMMITWISE / NDA. |
| `src/main.ts` | Orchestration commune : Lenis, révélations, onglets liés à l’URL (`#packs`), film de marque, chargement à la demande de la 3D et des présentations. |
| `src/ui/showcase.ts` + `src/scenes/*` | Séquence 3D (Three.js) : modèles procéduraux articulés, caméra multi-plans. |
| `src/lms/*` | Écrans LMS dessinés en Canvas 2D (logo officiel, données fictives) et attestation SPÉCIMEN. |
| `src/presentations/*` | Lecteur de « films » GSAP (chapitres, pause, lecture seulement si visible, format vertical sur mobile) et les trois montages. |
| `src/catalog/courses.ts` | Catalogue des formations (F01, F02, F03) : objectifs, leçons et durées vidéo mesurées, statut, évaluation. Ajouter une formation = ajouter un objet ici. |
| `src/config.ts` | **À compléter avant la mise en ligne** : URL du LMS, e-mail, endpoint du formulaire, statuts T/G/S. |
| `public/brand/` | Logo officiel détouré (sans modification des proportions) et symbole. |
| `public/media/` | Vidéos web issues du générique : boucle d’ouverture de porte (WebM/MP4, 960 et 1600 px) et film complet. |
| `public/_headers`, `vercel.json` | En-têtes de sécurité : CSP stricte, HSTS, `X-Frame-Options`, `Permissions-Policy`. |

### Accessibilité et performance

- `prefers-reduced-motion` : hero en image fixe, pas de scroll doux, séquence 3D en images fixes, films figés sur la fin de chaque chapitre.
- Sans WebGL, le contenu de la démonstration reste lisible en texte.
- three.js et les présentations sont chargés à la demande ; le rendu est suspendu hors écran.

## Règles de contenu

- Marque **Alurforma** uniquement : ni « ALUR Formation Pro », ni ALURIA.
- Aucun chiffre, avis, prix, certification ou reconnaissance CCI inventé.
- Formations individuelles de 1 h à 12 h, sans durée détaillée par formation ; packs 14 h, 28 h, 42 h.
- 14 h par an **ou** 42 h sur trois années consécutives ; 2 h de non-discrimination + 2 h de déontologie sur trois ans.
- G et S : « en production », sans inscription possible.
- Données LMS et tableaux entreprise marqués « aperçu illustratif — données fictives ».

## À valider avant publication

1. `src/config.ts` : `lmsUrl`, `email` (actuellement `contact@alurforma.fr`, **à confirmer**) et `formEndpoint` (sinon le formulaire ouvre un e-mail pré-rempli).
2. Pages légales : compléter les champs « à renseigner » (forme juridique, siège, RCS, TVA, directeur de publication, hébergeur, médiateur…).
3. Statuts et durées des formations dans `src/catalog/courses.ts` : les mettre à jour à chaque mise en ligne (F01 version enrichie, F02 mise en ligne, F03 évaluations).
4. Intervenants : le site ne cite aucun nom, seulement les rôles « formateur référent » et « professionnel de terrain » (plusieurs formateurs selon les formations).
5. Tarifs TTC dès qu’ils sont fixés.
6. Statuts T/G/S : ne jamais afficher « disponible » pour un parcours inaccessible dans le LMS.

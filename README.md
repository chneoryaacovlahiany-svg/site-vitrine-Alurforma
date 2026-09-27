# Alurforma — site vitrine 3D

Page d’accueil de formation continue loi ALUR (cartes T, G, S), avec une démonstration produit en 3D temps réel pilotée par le scroll. On y voit l’ordinateur s’ouvrir, s’allumer sur l’espace apprenant et parcourir accueil → vidéo → cas pratique → progression. La caméra passe ensuite au smartphone, qui s’allume, pivote et montre le même parcours, puis une attestation « SPÉCIMEN » vient conclure.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build de production dans dist/
npm run preview    # sert dist/
```

## Architecture

| Fichier | Rôle |
|---|---|
| `index.html` | Tout le contenu éditorial, **pré-rendu en HTML** (lisible sans JavaScript, indexable). Métadonnées, OG, JSON-LD `Organization`, `FAQPage`, `Course`. |
| `src/main.ts` | Orchestration : Lenis (scroll doux), GSAP ScrollTrigger, choix du mode de démo, révélations, navigation, widgets. |
| `src/timeline.ts` | Les 10 plans de la séquence et les 6 légendes (sans dépendance à three.js). |
| `src/scenes/showcase.ts` | Scène WebGL unique : caméra multi-plans, keyframes, lissage indépendant du framerate, rendu uniquement si visible. |
| `src/scenes/devices.ts` | Modèles procéduraux **articulés** : base, clavier, charnière et capot indépendants ; smartphone ; feuille d’attestation. |
| `src/lms/desktop.ts`, `mobile.ts` | Écrans LMS dessinés en Canvas 2D, puis appliqués comme textures sur les écrans 3D (net à toute résolution, aucune vidéo à charger). |
| `src/lms/attestation.ts` | Attestation SPÉCIMEN avec les 4 mentions de l’art. 5 du décret n° 2016-173. |
| `src/config.ts` | **Seul fichier à compléter avant la mise en ligne** (URL LMS, e-mail, endpoint du formulaire, logo, statuts T/G/S). |
| `src/ui/*` | Configurateur 7/14/42 h, onglets accessibles, formulaire. |
| `*.html` (racine) | Pages légales, sous forme de gabarits à compléter. |
| `public/_headers`, `vercel.json` | En-têtes de sécurité : CSP stricte, HSTS, `X-Frame-Options`, `Permissions-Policy`, cache immuable des assets. |

### Trois modes de démonstration

- **`scroll`** (desktop ≥ 1100 px, souris) : section collante de 820 vh, la molette pilote les 10 plans et la barre latérale permet de sauter à un plan.
- **`auto`** (mobile, tablette, tactile) : lecture automatique en boucle, avec **bouton Pause**, plans accessibles au toucher, pause automatique hors écran et quand l’onglet est masqué.
- **`static`** (WebGL indisponible) : le contenu essentiel reste affiché en texte.

Avec `prefers-reduced-motion`, il n’y a ni lecture automatique ni scroll doux : l’utilisateur choisit un plan et voit une image fixe.

### Performance

- three.js (≈ 134 Ko gzip) est chargé **à la demande** (`import()` après `requestIdleCallback`) et n’est pas préchargé : le hero HTML s’affiche sans l’attendre.
- Les pages LMS sont pré-rendues une seule fois ; à chaque frame, seule une tranche est recopiée, et uniquement si l’état change.
- Le rendu WebGL est suspendu hors écran (IntersectionObserver).

## Règles de contenu appliquées (audits du 26/08/2026)

- Marque **Alurforma** uniquement : ni « ALUR Formation Pro », ni ALURIA.
- Aucun chiffre, avis, prix, certification ou reconnaissance CCI inventé.
- 14 h par an **ou** 42 h sur trois années consécutives ; 2 h de non-discrimination + 2 h de déontologie sur trois ans ; les 7 h sont présentées comme un format de catalogue, non comme une exigence légale.
- G et S sont affichés « Programme conçu — production en cours », sans inscription possible.
- Toutes les données LMS affichées portent la mention « Aperçu illustratif — données fictives ».
- Le seuil de réussite des quiz et la méthode « Vérifier, Délimiter, Tracer » sont présentés comme des choix pédagogiques internes.
- Aucun paiement ni tunnel n’est simulé : les CTA mènent au configurateur, aux fiches ou au formulaire.

## À valider avant publication (P0)

1. `src/config.ts` : `lmsUrl`, `email` (actuellement `contact@alurforma.fr`, **à confirmer**), `formEndpoint` (sinon le formulaire ouvre un e-mail pré-rempli), `logo` (déposer le PNG officiel dans `public/brand/` et renseigner son chemin : il n’est jamais redessiné).
2. Pages légales : compléter tous les champs `à renseigner` (entité, SIREN, NDA, hébergeur, médiateur…).
3. Catalogue T01–T06 (`index.html` et `src/ui/catalog.ts`) : aligner titres et résumés sur les fiches réelles, et confirmer que T01 couvre bien les thèmes non-discrimination et déontologie.
4. Statuts : ne passer T en « Disponible » que si les parcours sont réellement accessibles dans le LMS.
5. Tarifs : afficher les prix TTC lorsqu’ils sont fixés (le texte actuel annonce qu’ils sont communiqués avant toute inscription).
6. Image Open Graph `public/og-alurforma.png` générée depuis la scène 3D ; à remplacer par un visuel incluant le logo officiel.

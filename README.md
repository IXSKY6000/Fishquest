# FishQuest 🎣

Application française d’exploration des eaux douces, construite avec React, TypeScript, Vite et Leaflet, et embarquée sur Android avec Capacitor. Elle fonctionne sans compte, backend ni clé payante. Voir [la version Android](docs/ANDROID.md).

## Démarrer

Prérequis : **Node.js 24** et npm. Toutes les dépendances et le cache npm restent dans le projet ; aucune installation globale ni `sudo`.

```bash
cd /workspace/Fishquest
npm ci --cache .cache/npm --no-audit --no-fund
npm run dev
```

Le terminal indique le port de développement (5173 par défaut). Pour une version de production locale, avec le service worker PWA :

```bash
npm run build
npm run preview -- --port 4173
```

Pour publier l’application sur un hébergeur statique, servir `dist/` à la racine d’un domaine en **HTTPS** avec repli vers `index.html`. `vite preview` sert uniquement à vérifier une compilation localement, pas à héberger une application en production. La géolocalisation et la PWA exigent HTTPS, sauf sur localhost.

## Utiliser l’application

1. **Carte** : déplacez et zoomez la vraie carte OpenStreetMap. Recherchez explicitement une ville, un lac ou une rivière, ou tapez une des six espèces du guide. Les recherches de lieux sont attribuées à Nominatim et ne fonctionnent pas en saisie automatique.
2. Cadrez une petite zone en France, puis **Charger ce secteur** pour consulter Hub’Eau. La couverture dépend des stations inventoriées ; il n’y a pas de poissons garantis dans chaque lac. Les données sont un échantillon, limité à 20 points consultés et 600 lignes individuelles par chargement. Les espèces prises en charge sont brochet, perche, truite fario, sandre, carpe commune et silure. Les individus sont regroupés par point de prélèvement et espèce ; seule la date la plus récente du lot reçu est retenue.
3. **Essayer les exemples** active huit indications **fictives**, jamais substituées automatiquement aux données réelles. Ce mode permet de tester les couches, le regroupement et les fiches sans dépendre d’Internet. Ce ne sont pas des spots recommandés.
4. Touchez une indication pour ouvrir sa fiche, sa provenance, sa date et sa qualification si elles sont fournies. Le bouton **Trouver le bon appât** ouvre le conseiller avec l’espèce sélectionnée. À très fort zoom, les icônes d’une même station sont écartées visuellement en pixels ; elles représentent toujours la même station.
5. **Prévisions** consulte Open-Meteo pour le lieu sélectionné. Le bouton de chargement des inventaires utilise le centre du secteur affiché. Les horaires sont affichés en heure de Paris, les réponses de l’API sont demandées en UTC. Les créneaux ne sont pas des garanties de capture.
6. **Conseiller** utilise une base par espèce, la saison, la lumière, le type d’eau, le courant et les données facultatives renseignées par vous. Il distingue les appâts que vous possédez. Les plages de poids et de profondeur sont des conseils, pas des mesures du lac.
7. **Identification** accepte et prévisualise localement JPEG, PNG et WebP jusqu’à 10 Mo. Le bouton d’analyse est inactif : **aucun modèle de reconnaissance connecté**. Le guide manuel n’est pas un résultat d’identification. Les images ne sont pas téléversées.
8. **Exploration** demande un consentement avant le GPS. Un nouveau secteur doit être à 250 m ou plus des découvertes précédentes et la précision GPS doit être de 100 m ou mieux. Il donne 100 XP ; cinq secteurs font gagner un niveau. L’exploration s’arrête si la page passe en arrière-plan. Le brouillard facultatif révèle les environs des points effectivement visités. Les découvertes et missions sont conservées sur ce navigateur et peuvent être effacées.

Mode clair et sombre ; navigation inférieure sur mobile ; contrôles accessibles au clavier ; prise en compte des animations réduites. Pas de réseau social ni de carnet de captures.

## État et limites de cette version

| Fonction                                                            | État                                                                                                                                                                                                              |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interface, navigation, carte Leaflet, filtres, regroupement, fiches | Implémentés et testés dans Chromium sur ordinateur et mobile                                                                                                                                                      |
| OpenStreetMap, Nominatim, Hub’Eau et Open-Meteo                     | Réponses réelles vérifiées le 7 novembre 2026 : tuiles OSM, recherche Nominatim, inventaires Hub’Eau v1.1 et météo Open-Meteo. Interface vérifiée avec de vraies réponses et TLS activé                           |
| Satellite Esri                                                      | Fond optionnel avec attribution et erreur explicite ; accès et conditions du fournisseur à revalider avant diffusion publique                                                                                     |
| Photographies                                                       | Recherche documentaire Wikimedia à l’ouverture d’une fiche, avec auteur/licence si disponible ; illustration originale de secours ; métadonnées Wikimedia consultées en direct ; image de secours en cas de panne |
| Observations hors inventaires                                       | Exemples fictifs seulement, aucun signalement réel ou utilisateur connecté                                                                                                                                        |
| Zones favorables                                                    | Version limitée à des cercles de contexte de 200 m autour des inventaires, y compris fictifs en démo. Ce ne sont **pas** des zones écologiques calculées. Confiance faible, limites pouvant inclure des terres    |
| Eau, profondeur, débit, habitat local mesuré                        | **Données indisponibles** ; aucun capteur, aucune bathymétrie et aucun rapprochement hydrologique fiable intégrés                                                                                                 |
| Moteur de conditions                                                | Règles explicables v1, aucune IA, aucune probabilité de capture validée scientifiquement                                                                                                                          |
| Reconnaissance automatique                                          | Inactive ; nécessite un véritable fournisseur ou modèle évalué et configuré                                                                                                                                       |
| PWA                                                                 | Manifest, icônes et service worker générés, enregistrement vérifié dans Chromium ; installation système sur téléphone physique non testée                                                                         |

Les icônes ne sont jamais des détections de poissons en temps réel. Un inventaire historique ne prouve pas une présence actuelle. L’absence de résultat ne prouve pas l’absence d’une espèce. Les autorisations de pêche, périodes d’ouverture, dangers et droits d’accès doivent être vérifiés localement.

## Réseau, sources et licences

Voir [docs/SOURCES.md](docs/SOURCES.md) pour les champs, limites, provenance, attributions et vérifications réalisées. Le navigateur appelle directement les services publics via HTTPS ; les réponses externes sont validées avant normalisation.

La politique réseau a été ouverte le 7 novembre 2026. La vérification réelle a reçu les stations et observations Hub’Eau (HTTP 206 : échantillon partiel), la météo Open-Meteo (HTTP 200) et les tuiles OSM. Les comptes rendus et captures sont dans `artifacts/`. Le script de test transporte les réponses par le client HTTPS système du cloud, sans désactiver TLS ni modifier le magasin de confiance Chromium. Aucun secret n’est requis.

En cas de tuiles inaccessibles, quelques lacs et fleuves réels de Natural Earth servent de repères vectoriels locaux. Ces géométries au 1:10 millions sont généralisées, non exhaustives et insuffisantes pour naviguer au bord de l’eau. Un avertissement est affiché. Aucun faux fond satellite n’est utilisé.

La PWA conserve l’interface, les illustrations et ces géométries locales. **Pas de préchargement, de téléchargement en masse ni de cache hors ligne des tuiles OSM**, et pas de cache des réponses scientifiques ou météo. Une première ouverture en ligne est nécessaire pour préparer le cache applicatif. Les données locales ne sont pas synchronisées entre appareils.

## Vérifications

```bash
npm run check
npm test
npm run build
npm run test:e2e
npm run format:check
```

Les tests de domaine vérifient les règles de prévision, conseils, progression GPS et normalisation des réponses. Les tests Playwright exercent les vrais composants et la compilation de production, sur deux tailles d’écran, avec **réponses API simulées** pour des résultats reproductibles ; d’autres parcours simulent explicitement des pannes. Ils sont complétés par une vérification séparée des fournisseurs externes via `scripts/verify-live.mjs`.

Les tests navigateur utilisent le Chromium système `/usr/bin/chromium`. Si absent, installer un navigateur séparément selon votre système ou définir `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` dans le processus de test. Aucun outil système n’est installé par les scripts. Les captures et traces sont générées dans `test-results/`, ignoré par Git.

Un contrôle de sécurité de dépendances de production a été réalisé. Des alertes transitives modérées/basses peuvent subsister dans Workbox (outillage de compilation PWA) ; consulter `npm audit`. Les motifs de glob de compilation sont définis dans le dépôt et ne proviennent pas d’une entrée utilisateur.

## Architecture et extensions

```text
src/
  components/     carte, marqueurs, fiches et éléments partagés
  data/           base d’espèces et exemples explicitement fictifs
  domain/         types, règles météo, conseiller, distances et progression
  hooks/          stockage local validé
  pages/          carte, prévisions, conseiller, identification, exploration
  services/       adaptateurs HTTP, Hub’Eau, Open-Meteo, recherche, vision
tests/            parcours navigateur desktop et mobile
public/           illustrations, icônes et géométries locales sourcées
```

Le backend n’est pas nécessaire à cette première version. Si un fournisseur de vision nécessite un secret, créer un service FastAPI avec environnement virtuel `.venv` local : la clé reste côté serveur, jamais dans une variable Vite exposée. Implémenter l’interface `VisionProvider` dans `src/services/vision.ts`, vérifier les résultats du modèle, son niveau de confiance et ses espèces prises en charge, puis activer l’analyse dans le parcours photo. L’interface reste volontairement inactive d’ici là.

Pour de futurs signalements, le type `Presence` distingue déjà couche, source, date, fiabilité et démonstration. Un stockage SQLite côté serveur pourra ensuite évoluer vers PostgreSQL/PostGIS. L’intégration hydrologique devra vérifier le lien au même cours d’eau, les unités, la fraîcheur, la qualification et la couverture avant d’utiliser une mesure. Les zones écologiques avancées nécessitent de vraies données d’habitat et de profondeur et une méthode évaluée, encore absentes ici.

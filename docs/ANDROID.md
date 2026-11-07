# Android — FishQuest 0.2.0

Paquet `fr.fishquest.app`, Android 7.0 / API 24 minimum, cible API 36. L’APK embarque le frontend : aucun ordinateur, compte FishQuest ou serveur Vite n’est nécessaire sur le téléphone. Les cartes, inventaires et prévisions nécessitent Internet ; le conseiller, le guide et les découvertes locales restent utilisables sans connexion.

## Installer et vérifier

La compilation produit `artifacts/FishQuest-0.2.0-debug.apk`, signé avec la clé de développement locale. La somme SHA-256 se trouve dans le fichier `.apk.sha256` adjacent. Le script vérifie la signature avec `apksigner` avant copie. Installer l’APK depuis les téléchargements Android et autoriser cette source d’installation si Android le demande. Cette version de test n’est pas une publication Google Play ; conserver une clé de production distincte pour une distribution en boutique.

## Recompiler

Prérequis : Node.js 24, JDK 21 complet, SDK Android avec `platforms;android-36`, `build-tools;36.0.0` et `platform-tools`. Dans cette session, Temurin 21.0.13+9 et les outils Google ont été téléchargés depuis leurs sources officielles, avec vérification des sommes de contrôle, dans `.cache/android/`. Gradle 8.14.3 est vérifié par son SHA-256 dans le wrapper. Aucun outil système n’est installé globalement.

```bash
cd /workspace/Fishquest
npm ci --cache .cache/npm --no-audit --no-fund
npm run android:build
```

Le script utilise `.cache/android/jdk` et `.cache/android/sdk`, ou les sélecteurs `JAVA_HOME` et `ANDROID_HOME` fournis par votre machine. Il n’installe pas automatiquement un outil manquant : installer les prérequis depuis les outils officiels Android / un JDK, ou restaurer l’environnement préparé. Les dépendances, préférences Android, clés et caches restent dans le projet. `android/local.properties` est généré et ignoré par Git.

Le build compile le frontend, synchronise Capacitor, compile l’APK, lance Android Lint et vérifie la signature. Pour Android Studio, ouvrir le dossier `android/` après `npm run android:sync`. Les sorties et clés ne sont pas versionnées.

## Intégration native et vie privée

- Origine locale sécurisée `https://localhost`, sans URL de serveur de développement dans l’APK.
- Géolocalisation native après consentement FishQuest et permission Android ; aucune permission de localisation en arrière-plan.
- Un secteur demande une précision de 100 m ou mieux. Les positions restent locales et ne sont pas publiées.
- Le bouton Retour Android ferme une fiche, revient à la carte, puis quitte depuis la carte.
- Pas de service worker dans l’APK : une mise à jour utilise les nouveaux fichiers embarqués.
- Sauvegarde automatique Android désactivée pour les découvertes privées. Pas de permission de stockage global pour sélectionner une photo.
- TLS activé, pas de règle de confiance universelle ni de trafic HTTP distant autorisé.

## Validation et limites

Les tests métier et navigateur sont lancés avec `npm test` et `npm run test:e2e`. Les parcours reproductibles utilisent des fixtures. Le script `scripts/verify-live.mjs` vérifie séparément les **vraies réponses** Hub’Eau, Open-Meteo et OSM dans l’interface, sans données simulées. Dans le cloud, lancer l’application sur le port 5173 puis :

```bash
NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt node scripts/verify-live.mjs
```

Ce test utilise un client HTTPS faisant confiance au magasin système, sans désactiver TLS ni modifier le magasin Chromium. L’APK appelle directement les fournisseurs publics. Les comptes rendus, captures et empreintes sont dans `artifacts/`. Le test d’un émulateur ne valide pas les capteurs d’un téléphone physique.

L’identification automatique reste inactive sans véritable modèle de vision. Le parcours photo fonctionne localement et propose le guide manuel. Les cercles indicatifs ne sont pas une prédiction scientifique ; profondeur, température de l’eau et débit restent indisponibles. Aucun résultat n’est inventé.

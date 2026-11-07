# Sources, provenance et contrats externes

Relevé du 7 novembre 2026. Après ouverture de la politique réseau, les vraies réponses ont été vérifiées : schéma OpenAPI Hub’Eau v1.1, stations, observations, météo Open-Meteo, recherche Nominatim, tuiles OSM et métadonnées Wikimedia. Voir `artifacts/verification-api-reelles.json`. Les tests reproductibles conservent des fixtures distinctes. Le test navigateur en direct utilise les réponses réelles via un client HTTPS faisant confiance au magasin système du cloud, sans désactiver TLS.

## Hub’Eau / OFB / BRGM

- Documentation : <https://hubeau.eaufrance.fr/page/api-poisson>.
- Exemple officiel consulté : [BRGM/hubeau, Api_poissons_1.2.ipynb](https://github.com/BRGM/hubeau/blob/7f89b2b864262b5489315b54d617ce6b55fc55da/code_examples/Api_poissons_1.2.ipynb).
- Routes documentées : `/api/v1/etat_piscicole/stations`, `/api/v1/etat_piscicole/observations`, `/operations`, `/indicateurs`. FishQuest utilise uniquement les deux premières, jamais une route `/poissons` supposée.
- Champs consultés dans l’exemple : `code_station`, `libelle_station`, `latitude`, `longitude`, `date_operation`, `code_alternatif_taxon`, `nom_latin_taxon`, `libelle_qualification_operation`. Les coordonnées Lambert (`coordonnee_x_station`, `coordonnee_y_station`) ne sont pas traitées comme WGS84.
- `bbox` WGS84 : longitude min, latitude min, longitude max, latitude max. Filtre vérifié dans le schéma OpenAPI et par une requête réelle ; les stations reçues sont aussi filtrées localement selon l’emprise demandée.
- Limites applicatives : emprise de 3° de côté maximum, 20 points consultés, 600 observations individuelles avec sélection des seuls champs nécessaires, pas de pagination exhaustive. Deux requêtes au plus par chargement, espacées d’au moins 550 ms ; chargements déclenchés explicitement.
- Couverture : France, stations inventoriées, données historiques, non exhaustive. Ne couvre pas automatiquement la partie suisse du Léman.
- Qualification affichée telle que reçue ; aucune probabilité numérique de présence ni fiabilité scientifique inventée.
- Réutilisation : données SIE sous Licence Ouverte Etalab, confirmée dans les [conditions générales Hub’Eau](https://hubeau.eaufrance.fr/page/conditions-generales), section 5.1.3, consultées le 7 novembre 2026. Attribution du producteur et lien vers la requête conservés. Pagination limitée par le fournisseur à 20 000 résultats et URL à 2 083 caractères ; FishQuest reste volontairement bien en dessous et n’effectue pas de collecte massive.

## Open-Meteo

- Route : `https://api.open-meteo.com/v1/forecast`.
- Documentation source consultée : [README officiel](https://github.com/open-meteo/open-meteo).
- Données : `temperature_2m`, `wind_speed_10m`, `precipitation`, `surface_pressure`, `cloud_cover` en données courantes et horaires ; minima et maxima de l’air et pluie quotidienne, sur 5 jours.
- Unités demandées : °C par défaut, vent explicitement en km/h, précipitations en mm, pression en hPa, couverture nuageuse en %. Fuseau `GMT` ; l’interface convertit vers `Europe/Paris`.
- Les conditions courantes Open-Meteo sont des sorties de modèles météo, pas un thermomètre situé au point sélectionné. Elles ne donnent ni température d’eau ni profondeur ni débit.
- Données sous **CC BY 4.0**, attribution visible. API gratuite sans clé pour usages **non commerciaux** ; vérifier l’offre et les limites officielles pour un usage commercial. Aucune garantie de disponibilité.

## Carte et recherche

- OpenStreetMap : `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, attribution visible « © OpenStreetMap contributors ». Données ODbL, tuiles soumises à la [politique OSM](https://operations.osmfoundation.org/policies/tiles/). Pas de bulk download, préchargement ou cache PWA des tuiles. Les en-têtes de cache du fournisseur restent gérés normalement par le navigateur.
- Nominatim : `https://nominatim.openstreetmap.org/search`, `format=jsonv2`, langue française, 5 résultats. Recherches explicites seulement, pas d’autocomplétion ; intervalle minimal 1,1 seconde entre requêtes d’une session, attribution visible. [Politique](https://operations.osmfoundation.org/policies/nominatim/). Une application distribuée à grande échelle devra utiliser une instance dédiée ou un fournisseur adapté et une limitation globale côté serveur.
- Satellite facultatif : service Esri World Imagery `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`. Attribution Esri / Maxar / Earthstar Geographics / GIS User Community. **Disponibilité, crédits régionaux et droit d’usage à revalider avant diffusion** ; aucune authentification payante ajoutée et aucune fausse image de secours.

## Repères locaux Natural Earth

- Source : [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector/tree/master/geojson).
- Jeux : `ne_10m_lakes.geojson`, `ne_10m_rivers_lake_centerlines.geojson`.
- Licence : [domaine public](https://www.naturalearthdata.com/about/terms-of-use/).
- Extraction réalisée : sélection des entités ayant au moins un sommet dans l’emprise `[-5.5, 41, 10, 51.5]` ; géométries conservées, propriétés réduites au nom et à la source. Certains cours d’eau traversent plusieurs pays. Aucune observation piscicole dérivée.
- Résolution : 1:10 millions ; ne couvre pas tous les plans d’eau et ne convient pas à une navigation précise. Sert uniquement de contexte lorsque les tuiles sont inaccessibles.
- SHA-256 des fichiers embarqués :

```text
93b86070ca37d43b2c1f8da083f5be5e4a793795456645de5a84dcd96cdf8eed  ne_10m_lakes.geojson
2f8f4fef5e49eef4198c33e036449287fb3bf7285d820e9b5e8da9091209da36  ne_10m_rivers_lake_centerlines.geojson
```

## Espèces, photos et illustrations

- Fiches : texte éditorial original de connaissances générales, avec renvoi à [DORIS / FFESSM](https://doris.ffessm.fr/). Pas de copie de photographies ou de texte de ce site, pas de validation scientifique revendiquée des règles de pêche.
- Illustrations : SVG originaux dans `public/fish`, utilisés comme illustrations et jamais décrits comme des photographies.
- Photos documentaires : recherche Wikimedia Commons par nom scientifique via l’API MediaWiki, miniature distante, page source, auteur et licence restitués par les métadonnées. Ces images documentaires ne constituent pas une reconnaissance du poisson de l’utilisateur. Vérifier les résultats de recherche et les licences individuelles en cas d’exploitation éditoriale.
- Démonstration : huit positions fictives, sans date réelle ni mesure. Bannière et provenance explicites, désactivées par défaut.

## Domaines de l’application

Fonctions de base : `tile.openstreetmap.org`, `nominatim.openstreetmap.org`, `hubeau.eaufrance.fr`, `api.open-meteo.com`.

Optionnels : `server.arcgisonline.com` (satellite), `commons.wikimedia.org`, `upload.wikimedia.org` (photos).

Les services externes reçoivent les coordonnées nécessaires aux requêtes de carte et météo, ou le texte de la recherche. Aucun signalement public de position, cookie d’analyse ou serveur de collecte FishQuest. Images importées et progression personnelle restent locales. Pas de secret requis par les intégrations actuelles.

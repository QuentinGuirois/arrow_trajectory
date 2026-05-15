# Arrow Trajectory

Simulateur web vanilla JavaScript + Plotly + Web Worker pour trajectoire de flèche, comparaison de setups et diagnostics avancés.

## Lancer le projet

Le projet utilise des modules ES et un Web Worker module. Il doit être servi par un serveur local :

```bash
python -m http.server 8080
```

Ou avec l’extension Live Server de votre éditeur.

## Modes

### Mode simple

Affiche uniquement les fondamentaux :

- nom du setup et preset ;
- type d’arc ;
- vitesse chrono / initiale ;
- masse totale, diamètre, angle de tir ;
- offset et angle de visée ;
- vent, direction et température ;
- énergie initiale ;
- boutons Enregistrer, Partager, Effacer.

Toute modification recalcule automatiquement les graphes et les stats après un court debounce.

### Mode avancé

Ajoute les paramètres techniques utiles :

- masse par composants GPI ;
- longueur de flèche, composants, vanes, fletching ;
- spine statique saisi ;
- draw weight / draw length ;
- champs compound informatifs ;
- environnement avancé ;
- tuning et dispersion expérimentale.

## Vitesse

La vitesse `fps` saisie est la vérité principale du modèle.

Si la vitesse est mesurée au chronographe, elle ne doit pas être recalculée depuis la masse de flèche. La masse influence l’énergie, le momentum, la traînée et la trajectoire, mais pas la vitesse chrono saisie.

## Spine

Le spine statique est une mesure de déflexion du tube.

- nombre bas = tube plus raide ;
- nombre haut = tube plus souple ;
- augmenter la puissance demande généralement un tube plus raide ;
- allonger la flèche ou alourdir la pointe assouplit le comportement dynamique ;
- raccourcir la flèche ou alléger la pointe rigidifie le comportement dynamique.

Les recommandations fabricant viennent uniquement de tables transcrites et vérifiées. Sans table vérifiée chargée, le simulateur retourne `no-data` et affiche : `Recommandation indisponible : aucune table fabricant vérifiée ne correspond à ces paramètres.`

Le mode `Spine généralisé` est une estimation indicative distincte : il agrège seulement les rows fabricant vérifiées déjà intégrées, sans remplacer les recommandations spécifiques d'une marque.

Les valeurs saisies par l'utilisateur sont rattachées aux plages ou colonnes du tableau fabricant seulement lorsqu'une règle locale est documentée. Le simulateur n'extrapole pas hors tableau.

Le spine reste séparé de la trajectoire balistique : il ne modifie pas le vol du centre de masse. En revanche, le spine saisi est comparé à la plage conseillée et influence les diagnostics de tuning, surtout le risque de fishtailing.

L’étude scientifique locale documente les limites du spine statique et les paramètres dynamiques associés ; elle ne produit pas de recommandation dynamique numérique. Les tendances affichées par le simulateur restent qualitatives.

## Architecture

- `index.html` : interface française, mode simple/avancé et conteneurs Plotly.
- `script-archery.js` : orchestration UI, recalcul debouncé, Worker, partage et sauvegarde.
- `state.js` : valeurs par défaut, presets indicatifs, état applicatif.
- `units.js` : conversions et helpers numériques.
- `arrow-builder.js` : masse, FOC, surface frontale, données de spine sans recommandation inventée.
- `spine-tables.js` : registre séparé des sources fabricant et rows vérifiées.
- `spine-lookup.js` : recherche stricte + lookup utilisateur, sans extrapolation.
- `spine-generalized.js` : estimation indicative issue des tables fabricant intégrées.
- `spine-recommendation.js` : résolution unique du conseil utilisé par l'UI et le tuning.
- `spine-evaluation.js` : comparaison entre spine saisi et fourchette conseillée.
- `bow-utils.js` : normalisation des familles d'arc et décoche interne dérivée.
- `spine-display.js` : helpers d'affichage spine en français.
- `spine-trends.js` : tendances qualitatives et limites du spine statique.
- `calibration.js` : vitesse chrono/utilisateur et sight marks par interpolation.
- `tuning-diagnostics.js` : porpoising/fishtailing comparatifs.
- `physics-advanced.js` : densité air, vent, Cd simplifié avec Reynolds corrigé.
- `trajectory.worker-archery.js` : solveur 3D dans Web Worker.
- `plotly-charts.js` : graphes Plotly.
- `share-schema.js` : partage URL versionné et localStorage.
- `style-extra.css` : thème futuriste et layout.

## 3D et dérive

Le graphe 3D Plotly affiche la trajectoire du centre de masse :

- X = distance en mètres ;
- Y = dérive latérale en mètres ;
- Z = hauteur en mètres.

Le tuning ne déforme pas la trajectoire physique. Porpoising, fishtailing et AoA sont des diagnostics séparés.

## Limites

- Pas de modèle mécanique complet de flexion de flèche.
- Pas de dynamique 6-DoF.
- Cd simplifié malgré un Reynolds plus correct.
- Vent constant avec rafales simplifiées.
- Les presets sont indicatifs, pas des recommandations professionnelles.
- Les recommandations spine fiables nécessitent une table fabricant chargée.

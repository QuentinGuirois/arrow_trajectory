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

Les recommandations viennent uniquement de tables fabricant transcrites et vérifiées. Sans table vérifiée chargée, le simulateur retourne `no-data` et affiche : `Recommandation indisponible : aucune table fabricant vérifiée ne correspond à ces paramètres.`

L’étude scientifique locale documente les limites du spine statique et les paramètres dynamiques associés ; elle ne produit pas de recommandation dynamique numérique. Les tendances affichées par le simulateur restent qualitatives.

## Architecture

- `index.html` : interface française, mode simple/avancé et conteneurs Plotly.
- `script-archery.js` : orchestration UI, recalcul debouncé, Worker, partage et sauvegarde.
- `state.js` : valeurs par défaut, presets indicatifs, état applicatif.
- `units.js` : conversions et helpers numériques.
- `arrow-builder.js` : masse, FOC, surface frontale, données de spine sans recommandation inventée.
- `spine-tables.js` : registre séparé des sources fabricant, vide par défaut.
- `spine-lookup.js` : recherche stricte dans une table explicitement sélectionnée, sans interpolation.
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

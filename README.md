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

Le spine statique moderne est une mesure de déflexion du tube.

- nombre bas = tube plus raide ;
- nombre haut = tube plus souple ;
- augmenter la puissance demande généralement un tube plus raide ;
- allonger la flèche ou alourdir la pointe assouplit le comportement dynamique ;
- raccourcir la flèche ou alléger la pointe rigidifie le comportement dynamique.

Le simulateur ne produit aucune recommandation spine chiffrée sans table fabricant vérifiée. Le fichier `spine-tables.js` contient uniquement une structure prête à recevoir des tables réelles. Tant qu’aucune table n’est chargée, l’UI affiche : donnée non disponible / table non chargée.

## Architecture

- `index.html` : interface française, mode simple/avancé et conteneurs Plotly.
- `script-archery.js` : orchestration UI, recalcul debouncé, Worker, partage et sauvegarde.
- `state.js` : valeurs par défaut, presets indicatifs, état applicatif.
- `units.js` : conversions et helpers numériques.
- `arrow-builder.js` : masse, FOC, surface frontale, données de spine sans recommandation inventée.
- `spine-tables.js` : structure de tables fabricant vérifiées, vide par défaut.
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

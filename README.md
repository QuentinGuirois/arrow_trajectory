# Arrow Trajectory

Simulateur navigateur vanilla JavaScript pour trajectoire, tuning et comparaison de setups d’archerie.

## Lancer le projet

Le projet utilise des modules ES et un Web Worker module. Lancez-le avec un serveur local, par exemple :

```bash
python -m http.server 8080
```

Puis ouvrez `http://localhost:8080`.

## Architecture

- `index.html` : interface française, sections d’inputs, onglets Plotly, panneaux de stats et de diagnostics.
- `script-archery.js` : orchestration UI, lecture du formulaire, Worker, localStorage, partage URL et Three.js optionnel.
- `state.js` : état applicatif, valeurs par défaut, couleurs et presets.
- `units.js` : conversions et helpers numériques.
- `arrow-builder.js` : masse, FOC, surface frontale, spine dynamique proxy, stabilité et avertissements.
- `calibration.js` : calibration chrono, estimation par deux sight marks et estimation par repère géométrique.
- `tuning-diagnostics.js` : porpoising/fishtailing par deux oscillateurs amortis.
- `physics-advanced.js` : densité air enrichie, vent vectoriel, Cd variable, force-allonge expérimentale.
- `trajectory.worker-archery.js` : solveur balistique 3D hors thread principal.
- `plotly-charts.js` : rendu des graphes 2D, 3D, énergie, temps, holdover, dérive, tuning, AoA.
- `three-overlay.js` : animation procédurale optionnelle d’une flèche 3D via Three.js CDN.
- `share-schema.js` : partage URL versionné et sauvegarde localStorage.
- `physics-archery.js` : compatibilité avec l’ancien modèle.
- `util.js` : helpers génériques.
- `style-extra.css` : thème visuel existant avec ajouts pour sections et panneaux dérivés.

## Utilisation

1. Choisir un preset ou remplir le setup.
2. Ajuster Basique / Flèche / Arc / Environnement.
3. Utiliser `Simple` pour les champs essentiels ou `Avancé` pour calibration, tuning et force-allonge.
4. Cliquer `Calculer` pour sauvegarder et comparer la courbe.
5. Utiliser les onglets `2D`, `Énergie`, `Temps`, `Holdover`, `3D`, `Dérive`, `Tuning`, `AoA`.
6. `Partager` copie une URL avec schéma versionné.

## Physique simplifiée

Le solveur est 3D : position `x/y/z`, vitesse `vx/vy/vz`, gravité, vent vectoriel et densité d’air depuis pression, température, humidité et altitude. Le Cd dépend du diamètre, de la configuration de vanes, d’un proxy Reynolds, de la vitesse et d’un proxy d’angle d’attaque.

Le constructeur de flèche calcule :

- masse totale ou masse depuis GPI + composants ;
- FOC depuis point d’équilibre ou estimation par composants ;
- facteur de spine dynamique proxy ;
- surface frontale ;
- score de stabilité ;
- avertissements de cohérence.

## Tuning

Le porpoising et le fishtailing sont modélisés par deux oscillateurs amortis :

- porpoising : nocking point, sortie verticale et erreur verticale ;
- fishtailing : spine dynamique, center shot/plunger et erreur latérale ;
- spin : facteur de stabilisation et d’amortissement, pas cause directe du porpoising.

Ce modèle sert à comparer des tendances. Il ne remplace pas un test papier, bare shaft, walk-back ou group tuning réel.

## Expérimental

Sont explicitement expérimentaux :

- estimation de vitesse depuis sight marks ;
- estimation depuis repère + géométrie ;
- force-allonge utilisée pour dériver vitesse de sortie et excitation initiale ;
- angle d’attaque proxy ;
- dispersion / cône d’incertitude ;
- Cd variable approximé ;
- animation Three.js optionnelle.

## Limites

- Pas de modèle structurel complet de flexion de tube.
- Pas de gyroscopie réelle ni dynamique 6-DoF.
- Le vent est un vecteur constant avec rafale simplifiée.
- Les coefficients aérodynamiques sont calibrables conceptuellement mais pas validés en soufflerie.
- La calibration chrono reste la référence la plus fiable.

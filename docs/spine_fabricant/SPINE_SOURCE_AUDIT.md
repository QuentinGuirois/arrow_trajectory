# Spine Source Audit

Audit réalisé uniquement à partir des documents locaux présents dans :

- `docs/spine_fabricant/`
- `docs/spine_etude/`

Règle de lecture appliquée : aucune donnée n'est complétée par mémoire, interpolation ou déduction non explicitement visible dans les documents. Quand une information n'est pas lisible avec certitude, elle est marquée comme telle.

## Synthèse

| Fichier | Source | Type | Confiance | Potentiel d'intégration |
| --- | --- | --- | --- | --- |
| `301055-A-Arrow-Shaft-Selection-Target.pdf` | Easton | chart spine | high | ready-for-transcription |
| `spine_guide_gold_tips.pdf` | Gold Tip | sélecteur spine | high | needs-manual-check |
| `spine_guide_victory_archery.pdf` | Victory Archery | chart spine | high | ready-for-transcription |
| `TuningGuideEaston.pdf` | Easton | guide tuning | high | metadata-only |
| `carbon_express/adjustable-weight-chart-scaled.webp` | Carbon Express | autre | high | needs-manual-check |
| `carbon_express/hunting-arrow-shaft-selection-scaled2.webp` | Carbon Express | chart spine | high | ready-for-transcription |
| `carbon_express/hunting-trispine-arrow-shaft-selection-scaled5.webp` | Carbon Express | chart spine | high | ready-for-transcription |
| `carbon_express/target-arrow-selection-chart3.jpg` | Carbon Express | chart spine | high | ready-for-transcription |
| `../spine_etude/etude.pdf` | R. Fish, Y. Liang, K. Saleeby, J. Spirnak, M. Sun, X. Zhang | étude scientifique | high | metadata-only |

---

## 1. `301055-A-Arrow-Shaft-Selection-Target.pdf`

- **fabricant ou source** : Easton
- **type de document** : chart spine
- **version visible** : `PN 301055-A`
- **URL/source visible dans le document** : non visible
- **types d'arcs couverts** :
  - compound
  - recurve
  - target
- **unités utilisées** :
  - draw weight : livres (`lbs`)
  - arrow length : pouces (`"` / inches)
  - point weight : grains
  - speed class : FPS
  - spine notation : plages numériques fabricant (`2000-1800`, `500-450`, etc.)
- **convention de mesure de longueur de flèche** : `measured to throat of nock`
- **convention de point weight** : pointe seule visible dans la base de calcul (`glue-in 100 grain points`)
- **release type** :
  - mechanical
  - finger
- **classes de vitesse** :
  - baseline `301-320 FPS`
  - ajustements visibles : `up to 275`, `276-300`, `301-320`, `321-340`, `341-350`, `351 FPS or higher`
- **axes des tableaux** :
  - colonnes : longueur de flèche coupée
  - lignes : puissance d'arc
  - tableaux séparés : `A/C all-carbon arrow cut length` et `aluminum arrow cut length`
- **règles d'ajustement indiquées** :
  - le tableau est basé sur `301-320 FPS`, des pointes glue-in de `100 grain` et une décoche mécanique
  - ajustement de la puissance selon la classe de vitesse
  - finger release compound : `+5 lbs`
  - pointes `<100 grains` : `-3 lbs` par tranche de `25 grains` sous `100`
  - pointes `>100 grains` : `+3 lbs` par tranche de `25 grains` au-dessus de `100`
  - recurve : `carbon competition limb = no adjustment`, `wood/glass beginner limb = -5 lbs`
  - pour le recurve, si plusieurs options existent dans la plage recommandée, le document recommande de choisir le côté le plus souple
- **ambiguïtés** :
  - le document donne des **plages** de spine recommandées, pas une valeur unique
  - deux familles de matériaux coexistent sur la même page ; elles doivent rester séparées à l'intégration
- **niveau de confiance** : high
- **potentiel d'intégration** : ready-for-transcription

---

## 2. `spine_guide_gold_tips.pdf`

- **fabricant ou source** : Gold Tip
- **type de document** : sélecteur spine
- **version visible** : non visible
- **URL/source visible dans le document** : `goldtip.com`
- **types d'arcs couverts** :
  - compound
  - recurve
  - longbow
- **unités utilisées** :
  - draw weight : livres (`lbs`) via plages visibles
  - arrow length : pouces (`"` / inches)
  - point weight : grains
  - speed class : `IBO SPEED 315+ (FPS)` et `IBO SPEED 315- (FPS)`
  - spine notation : valeurs numériques fabricant (`700`, `600`, `500`, `400`, etc.)
- **convention de mesure de longueur de flèche** : de la gorge de l'encoche (`throat of the nock`) à l'extrémité de l'insert
- **convention de point weight** : `point + insert + Ballistic Collar + FACT weight`
- **release type** :
  - finger mentionné explicitement dans les recommandations compound
  - décoche de base des deux tableaux compound : non précisée dans le document
- **classes de vitesse** :
  - compound `IBO SPEED 315+ (FPS)`
  - compound `IBO SPEED 315- (FPS)`
- **axes des tableaux** :
  - colonnes : longueur de flèche
  - lignes : puissance d'arc
  - sous-colonnes de puissance liées au poids en pointe (`100`, `125`, `150 grains`)
- **règles d'ajustement indiquées** :
  - si broadhead plus long qu'une field point, choisir éventuellement un tube légèrement plus raide
  - en compound avec finger release : commencer deux cases plus souples, avec une flèche `1"` plus longue, puis couper par incréments de `1/4"`
  - en recurve/longbow : commencer avec une flèche au moins `1"` plus longue que la longueur finale souhaitée, puis raccourcir progressivement
- **ambiguïtés** :
  - la capture ne montre qu'une page et renvoie à un tableau de spécifications détaillées « on the next page » absent du dépôt
  - la décoche de référence des deux tableaux compound n'est pas explicitement nommée
  - le document combine sélection de spine et recommandations de tuning, ce qui demande de séparer strictement les données de table et les conseils qualitatifs
- **niveau de confiance** : high
- **potentiel d'intégration** : needs-manual-check

---

## 3. `spine_guide_victory_archery.pdf`

- **fabricant ou source** : Victory Archery
- **type de document** : chart spine
- **version visible** : non visible
- **URL/source visible dans le document** : `www.victoryarchery.com/arrow-guide/`
- **types d'arcs couverts** :
  - compound
  - recurve
- **unités utilisées** :
  - draw weight : plages numériques visibles, unité non imprimée dans le corps des tableaux
  - arrow length : pouces (`"` / inches)
  - point weight : grains dans les notes de base
  - speed class : FPS
  - spine notation : valeurs numériques fabricant (`1200`, `1100`, `500`, `400`, etc.)
- **convention de mesure de longueur de flèche** : non précisée
- **convention de point weight** :
  - compound haut : `standard 30 grain or less`
  - compound bas : `standard 50/60 grain insert`
  - recurve : `100-125 grain front`
- **release type** : non précisé
- **classes de vitesse** :
  - `Below 300 FPS`
  - `300-341 FPS`
  - `341-351 FPS`
  - `Above 351 FPS`
- **axes des tableaux** :
  - colonnes : longueur de flèche
  - lignes : plages de puissance
  - trois tableaux distincts visibles :
    - `VF/RIP XV/RVL SPINE CHART`
    - `HLR/VLR/VAP/VAP TKO/VAP SS/RIP/RIP TKO/RIP SS SPINE CHART *RIVAL(X)`
    - `RECURVE SPINE CHART`
- **règles d'ajustement indiquées** :
  - sous `300 FPS` : déduire `5 lbs`
  - `300-341 FPS` : poids de base
  - `341-351 FPS` : ajouter `5 lbs`
  - au-dessus de `351 FPS` : ajouter `10 lbs`
  - si la longueur et la puissance tombent sur le bord d'un spine avec une pointe de `100` ou `125 grains`, choisir le spine plus raide
- **ambiguïtés** :
  - le document est une capture d'une page ; aucune date ni version visible
  - les tableaux compound dépendent de familles de tubes et de conditions d'insert/back weight distinctes qu'il faudra conserver séparées
  - l'unité des plages de puissance n'est pas imprimée dans le corps des tableaux
- **niveau de confiance** : high
- **potentiel d'intégration** : ready-for-transcription

---

## 4. `TuningGuideEaston.pdf`

- **fabricant ou source** : Easton
- **type de document** : guide tuning
- **version visible** :
  - couverture : `2nd Edition`
  - fin de document : `Rev. 4, 4/99`
- **URL/source visible dans le document** : non visible
- **types d'arcs couverts** :
  - compound
  - recurve
  - target
  - hunting
- **unités utilisées** :
  - draw weight : ponctuellement selon les exemples de réglage
  - arrow length : pouces dans les schémas
  - point weight : évoqué dans plusieurs sections, sans table de sélection spine exploitable
  - speed class : non applicable
  - spine notation : non applicable comme table de sélection
- **convention de mesure de longueur de flèche** :
  - plusieurs conventions visibles selon le type de flèche et le contexte
  - exemples explicites :
    - cible : longueur correcte mesurée `3/4"` devant la partie la plus avancée du repose-flèche
    - chasse : règles de dégagement variables selon la fenêtre et le type de composant
- **convention de point weight** : non précisé comme convention unique
- **release type** :
  - finger
  - mechanical
- **classes de vitesse** : non applicable
- **axes des tableaux** : non applicable
- **règles d'ajustement indiquées** :
  - procédures de tuning progressives
  - sections sur bare shaft, paper tuning, broadhead tuning, micro tuning, F.O.C., assemblage et mesure
- **ambiguïtés** :
  - document très utile pour le vocabulaire et les limites pratiques, mais ce n'est pas une table de recommandation spine
  - les conventions de longueur varient selon l'usage ; elles ne doivent pas être transformées en une convention universelle
- **niveau de confiance** : high
- **potentiel d'intégration** : metadata-only

---

## 5. `carbon_express/adjustable-weight-chart-scaled.webp`

- **fabricant ou source** : Carbon Express
- **type de document** : autre
  - sous-type utile : tableau préalable de calcul de `Adjusted Bow Draw Weight`
- **version visible** : non visible
- **URL/source visible dans le document** : `www.safearrow.com`
- **types d'arcs couverts** :
  - compound
  - recurve et longbow mentionnés comme devant aller directement aux tableaux de sélection, pas comme bénéficiaires directs de ce tableau
- **unités utilisées** :
  - draw weight : livres (`lbs`)
  - arrow length : pouces (`"` / inches)
  - point weight : grains
  - speed class : AMO / IBO en FPS
  - spine notation : non applicable
- **convention de mesure de longueur de flèche** : non précisée
- **convention de point weight** :
  - non homogène dans le document
  - lignes visibles pour `Glue-In Target Points`
  - lignes visibles pour `Insert & ... Screw-In Point`
- **release type** :
  - finger
  - d'autres configurations de compound sont listées par cam / let-off
- **classes de vitesse** :
  - AMO : `240`, `245`, `250`, `255`, `260`, `270`, `280`, `290 FPS`
  - IBO : `300`, `306`, `313`, `319`, `325`, `335`, `345`, `360 FPS`
- **axes des tableaux** :
  - lignes : variables d'ajustement de configuration
  - colonnes : `Bow Draw Weight 59.9 lbs. or under`, `Bow Draw Weight 60 lbs. or over`, `Calculated Draw Weight`
- **règles d'ajustement indiquées** :
  - additions/soustractions selon type de cam, let-off, type/poids de pointe, longueur de flèche, finger release et vitesse
  - le document précise qu'un compound doit commencer par ce calcul avant de choisir le tube
- **ambiguïtés** :
  - ce document n'est pas une table de spine à lui seul
  - la convention de poids en tête dépend de la ligne utilisée
  - il doit être relié à un tableau Carbon Express compatible sans fusionner les logiques avec d'autres fabricants
- **niveau de confiance** : high
- **potentiel d'intégration** : needs-manual-check

---

## 6. `carbon_express/hunting-arrow-shaft-selection-scaled2.webp`

- **fabricant ou source** : Carbon Express
- **type de document** : chart spine
- **version visible** : non visible
- **URL/source visible dans le document** : non visible
- **types d'arcs couverts** :
  - compound
  - recurve
  - hunting
- **unités utilisées** :
  - draw weight : livres (`lbs`)
  - arrow length : pouces (`"` / inches)
  - point weight : non visible
  - speed class : non visible
  - spine notation : valeurs numériques fabricant et variantes de gamme (`800`, `700`, `XSD 500`, `SD 400`, etc.)
- **convention de mesure de longueur de flèche** : non précisée
- **convention de point weight** : non précisé
- **release type** : non précisé
- **classes de vitesse** : non applicable dans l'image elle-même
- **axes des tableaux** :
  - colonnes : longueur de flèche
  - lignes gauche : `Compound Bow (Adjustable Weight)`
  - lignes droite : `Recurve Bow (Bow Draw Weight)`
- **règles d'ajustement indiquées** :
  - le tableau s'appuie sur un poids ajusté pour les compounds
- **ambiguïtés** :
  - l'image seule n'explique pas comment calculer le poids ajusté ; elle dépend du tableau préalable Carbon Express
  - plusieurs familles de tubes apparaissent dans les cellules et doivent rester associées au fabricant et au document exact
- **niveau de confiance** : high
- **potentiel d'intégration** : ready-for-transcription

---

## 7. `carbon_express/hunting-trispine-arrow-shaft-selection-scaled5.webp`

- **fabricant ou source** : Carbon Express
- **type de document** : chart spine
- **version visible** : non visible
- **URL/source visible dans le document** : non visible
- **types d'arcs couverts** :
  - compound
- **unités utilisées** :
  - draw weight : livres (`lbs`) par plages visibles
  - arrow length : pouces (`"` / inches)
  - point weight : non visible
  - speed class : non visible
  - spine notation : valeurs numériques fabricant et variantes de gamme (`500`, `400`, `SD 400`, `TR 400`, etc.)
- **convention de mesure de longueur de flèche** : non précisée
- **convention de point weight** : non précisé
- **release type** : non précisé
- **classes de vitesse** : non applicable dans l'image elle-même
- **axes des tableaux** :
  - colonnes : longueur de flèche
  - lignes : `Compound Bow (Adjusted Weight)`
- **règles d'ajustement indiquées** :
  - aucune règle explicite visible dans l'image au-delà de l'usage d'un `Adjusted Weight`
- **ambiguïtés** :
  - le fichier est nommé `hunting-*`, mais le titre visible du document se limite à `Arrow Shaft Selection Chart`
  - l'image ne précise pas le tableau d'ajustement à utiliser ni la condition exacte des composants
- **niveau de confiance** : high
- **potentiel d'intégration** : ready-for-transcription

---

## 8. `carbon_express/target-arrow-selection-chart3.jpg`

- **fabricant ou source** : Carbon Express
- **type de document** : chart spine
- **version visible** : non visible
- **URL/source visible dans le document** : non visible
- **types d'arcs couverts** :
  - compound
  - recurve
  - target
- **unités utilisées** :
  - draw weight : livres (`lbs`)
  - arrow length : pouces (`"` / inches)
  - point weight : non chiffré dans le tableau, mais une note indique qu'une pointe plus lourde peut être nécessaire
  - speed class : non visible
  - spine notation : références produit / spine fabricant (`XB700`, `T23D500`, `XB400`, etc.)
- **convention de mesure de longueur de flèche** : non précisée
- **convention de point weight** : non précisé
- **release type** : non précisé
- **classes de vitesse** : non applicable dans l'image elle-même
- **axes des tableaux** :
  - colonnes : longueur de flèche
  - lignes gauche : `Compound Bow (Adjusted Weight)`
  - lignes droite : `Recurve Bow (Bow Draw Weight)`
- **règles d'ajustement indiquées** :
  - pour les compounds, calculer d'abord le poids ajusté depuis l'`adjusted weight chart`
  - les recurves utilisent le poids réel à l'allonge sur le côté droit du tableau
  - une note précise qu'une pointe plus lourde peut être requise pour obtenir un vol correct
- **ambiguïtés** :
  - le tableau encode des familles de tubes en plus d'un choix de spine ; il ne faut pas le réduire automatiquement à une unique notation universelle
- **niveau de confiance** : high
- **potentiel d'intégration** : ready-for-transcription

---

## 9. `docs/spine_etude/etude.pdf`

- **fabricant ou source** : R. Fish, Y. Liang, K. Saleeby, J. Spirnak, M. Sun, X. Zhang
- **type de document** : étude scientifique
- **titre visible** : `Dynamic Characterization of Arrows through Stochastic Perturbation`
- **version visible** : non visible
- **URL/source visible dans le document** : non visible
- **types d'arcs couverts** :
  - non applicable comme table de sélection
  - le texte introductif mentionne plusieurs familles d'arcs, mais l'étude porte sur les flèches et leurs paramètres dynamiques
- **unités utilisées** :
  - mesure de spine statique : masse suspendue de `880 g` appliquée au centre d'une flèche de `28 in`
  - fréquence propre : `Hz`
  - amortissement : ratio sans dimension
  - masse : `g`
  - raideur : `N/m`
  - notation fabricant : exemples `Carbon (300)`, `Carbon (500)`, `Carbon (600)`, etc.
- **convention de mesure de longueur de flèche** : non applicable comme sélection fabricant
- **convention de point weight** : non applicable
- **release type** : non applicable
- **classes de vitesse** : non applicable
- **axes des tableaux** :
  - non applicable pour la recommandation spine
  - tableaux scientifiques internes : matériau, fréquence, amortissement, masse, coefficient visqueux, raideur
- **règles d'ajustement indiquées** :
  - aucune règle de sélection fabricant
  - l'étude montre que la mesure statique seule ne capture pas complètement la performance dynamique
- **ambiguïtés** :
  - les résultats servent à expliquer les limites du spine statique
  - ils ne fournissent pas de table de recommandation ni de `dynamic spine number` utilisable dans l'application
- **niveau de confiance** : high
- **potentiel d'intégration** : metadata-only

---

## Conclusion d'audit

1. Les sources exploitables pour une future transcription de recommandations sont **fabricant-spécifiques** et doivent rester séparées :
   - Easton
   - Gold Tip
   - Victory Archery
   - Carbon Express
2. Les documents n'emploient pas tous les mêmes conventions :
   - longueur mesurée à la gorge de l'encoche chez Easton et Gold Tip
   - conventions de poids de pointe différentes selon les fabricants, et parfois selon les lignes du même document
   - ajustements de vitesse, release et composants spécifiques à chaque fabricant
3. L'étude scientifique locale doit être utilisée uniquement pour documenter les limites du spine statique et les paramètres dynamiques pertinents, **pas** pour produire une valeur numérique de spine dynamique.
4. Une architecture saine doit donc :
   - conserver des tables séparées par fabricant et par document
   - conserver les métadonnées de source
   - refuser toute recommandation si aucune table fabricant vérifiée ne correspond exactement aux paramètres disponibles

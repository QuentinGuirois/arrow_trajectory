# Easton 301055-A Transcription Notes

## Ce qui a été transcrit

- Source : `301055-A-Arrow-Shaft-Selection-Target.pdf`
- Page visible : `sourcePageLabel: "1"`
- Index interne : `sourcePageIndex: 0`
- Section transcrite :
  - `A/C • ALL-CARBON ARROW CUT LENGTH`
- Deux séries logiques séparées :
  - `bowType: "compound"`
  - `bowType: "recurve"`
- Matériau :
  - `arrowMaterialFamily: "A/C all-carbon"`
- Référence de pointe :
  - `pointWeightReferenceGrains: 100`

## Ce qui n'a pas été transcrit

- `ALUMINUM ARROW CUT LENGTH`
- tout autre fabricant
- toute application automatique des règles d'ajustement
- toute interpolation ou extrapolation entre colonnes

## Conventions retenues

- Les longueurs affichées dans les colonnes restent exactes :
  - exemple `28"` -> `arrowLengthMinIn: 28`, `arrowLengthMaxIn: 28`
- Les plages imprimées sont conservées comme référence textuelle :
  - `recommendedSpinesLabel: "575-500"`
- Un champ structuré supplémentaire est conservé sans remplacer le libellé imprimé :
  - `recommendedSpines: [575, 500]`
- Les rows compound et recurve restent séparées même si elles partagent la même grille visuelle.
- Les rows compound utilisent :
  - `releaseTypeReference: "mechanical"`
  - `bowSpeedClassReference: "301-320 FPS"`
- Les rows recurve utilisent :
  - `releaseTypeReference: "finger"`
  - `bowSpeedClassReference: null`
- `shaftFamilies` reste vide, car aucune famille précise n'est imprimée dans les cellules transcrites.

## Limites actuelles du lookup

- Le lookup strict ne matche que les cellules exactes déjà transcrites.
- Le lookup utilisateur applique uniquement la règle d'arrondi des longueurs fractionnaires explicitement imprimée par Easton.
- Les règles visibles dans `ADJUST THE CHART TO YOUR BOW SET-UP` sont stockées en métadonnées via `adjustmentRules`, mais ne sont pas appliquées.
- Aucun ajustement automatique n'est appliqué selon :
  - la vitesse ;
  - le poids de pointe ;
  - le type de décoche ;
  - le type de branches recurve.
- Les entrées en dehors des références de base actuellement transcrites doivent rester prudentes et retourner `no-data` si elles ne correspondent pas au cadre de référence retenu.

## Lookup utilisateur

- `lookupRecommendedSpineStrict(...)` reste le garde-fou de transcription :
  - aucune conversion de longueur ;
  - aucune interpolation ;
  - aucune extrapolation.
- `lookupRecommendedSpineForUser(...)` est utilisé par l'interface :
  - il applique la règle Easton imprimée pour les longueurs fractionnaires ;
  - il rattache par exemple `29.1"` et `28.9"` à la colonne `29"` ;
  - il accepte les valeurs intermédiaires d'une plage de puissance, par exemple `40.5 lbs` dans `40-44`.
- Le document Easton imprime explicitement :
  - `28.25"` -> colonne `28"`
  - `28.5"` -> colonne `29"`
- Le lookup utilisateur n'extrapole jamais hors du domaine couvert :
  - `20.4"` reste `no-data`
  - `34.6"` reste `no-data`
- Les tests stricts restent présents pour valider la fidélité de la transcription cellule par cellule.

## Gestion des bornes ouvertes

- La ligne compound imprimée `<17` est encodée ainsi :
  - `drawWeightMinLbs: null`
  - `drawWeightMaxLbs: 17`
  - `drawWeightMaxExclusive: true`
- La ligne recurve imprimée `<20 lbs.` est encodée ainsi :
  - `drawWeightMinLbs: null`
  - `drawWeightMaxLbs: 20`
  - `drawWeightMaxExclusive: true`
- Le lookup traite ces bornes avec une comparaison stricte :
  - si `drawWeightMaxExclusive === true`, la valeur doit être `< drawWeightMaxLbs`
  - sinon, la borne haute reste inclusive avec `<= drawWeightMaxLbs`
- Les tests dédiés couvrent maintenant :
  - `compound`, `16.9 lbs`, `21 in` -> matche la ligne `<17`
  - `compound`, `17.0 lbs`, `21 in` -> ne matche pas `<17` et matche la ligne suivante `17-23`
  - `recurve`, `19.9 lbs`, `21 in` -> matche la ligne `<20 lbs.`
  - `recurve`, `20.0 lbs`, `21 in` -> ne matche pas `<20 lbs.` et retourne `no-data`, car aucune ligne suivante ne commence à `20`
- Aucune borne haute ouverte n'existe dans la section A/C all-carbon actuellement transcrite.

## Tests manuels ajoutés

Les tests suivants ont été ajoutés dans `tests/spine.test.mjs` :

1. `compound`, `40 lbs`, `29 in` -> `575-500`
2. `compound`, `70 lbs`, `34 in` -> `200-150`
3. `recurve`, `21 lbs`, `22 in` -> `2000-1800`
4. `recurve`, `63 lbs`, `31 in` -> `300-250`
5. lookup strict : `compound`, `40 lbs`, `28.5 in` -> `no-data`
6. `compound`, `16.9 lbs`, `21 in` -> ligne `<17`
7. `compound`, `17.0 lbs`, `21 in` -> ligne `17-23`
8. `recurve`, `19.9 lbs`, `21 in` -> ligne `<20 lbs.`
9. `recurve`, `20.0 lbs`, `21 in` -> `no-data`

Chaque test de cellule vérifie aussi :

- `sourceSection: "A/C • ALL-CARBON ARROW CUT LENGTH"`
- `sourcePageLabel: "1"`

## Ambiguïtés restantes

- La règle d'arrondi des longueurs fractionnaires est désormais implémentée uniquement dans le lookup utilisateur.
- Les règles d'ajustement du bloc inférieur sont visibles mais pas encore traduites en logique de lookup.
- Les lignes ouvertes `<17` et `<20 lbs.` sont transcrites avec une borne supérieure exclusive et sont désormais couvertes par des tests dédiés.
- La section aluminum reste volontairement hors périmètre de cette passe.

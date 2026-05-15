# Spine Tables Import Guide

Ce guide décrit la méthode d'intégration des tables fabricant dans `spine-tables.js`.

## Principe central

Une recommandation de spine ne doit provenir que d'une cellule fabricant lue avec certitude, recopiée sans transformation, puis vérifiée.  
Si une cellule est incertaine, illisible, ambiguë ou dépend d'une règle encore non modélisée, elle reste absente.

## 1. Transcrire une table fabricant

1. Partir du document local exact déjà audité.
2. Créer ou utiliser l'entrée de source correspondant à **ce document précis**.
3. Ne jamais fusionner deux fabricants, ni deux documents Carbon Express distincts.
4. Transcrire cellule par cellule :
   - les bornes d'entrée visibles ;
   - la recommandation telle qu'affichée ;
   - les éventuelles familles de tubes associées ;
   - les notes utiles du document.
5. Marquer la source et la ligne `verified` seulement après relecture manuelle.

Une transcription peut rester volontairement partielle si seules certaines cellules sont relues avec certitude. Dans ce cas :

- déclarer la table avec `coverage: 'partial-verified-cells'` ;
- n'ajouter que les rows relues ;
- laisser le lookup retourner `no-data` hors de ces cellules.

Exemple de forme cible :

```js
{
  manufacturer: 'Easton',
  tableId: 'easton_target_301055A_ac_all_carbon',
  chartVersion: '301055-A',
  sourceFile: '301055-A-Arrow-Shaft-Selection-Target.pdf',
  sourcePageLabel: '1',
  sourcePageIndex: 0,
  sourceSection: 'A/C • ALL-CARBON ARROW CUT LENGTH',
  status: 'verified',
  bowType: 'compound',
  arrowMaterialFamily: 'A/C all-carbon',
  drawWeightMinLbs: 40,
  drawWeightMaxLbs: 44,
  arrowLengthMinIn: 29,
  arrowLengthMaxIn: 29,
  pointWeightReferenceGrains: 100,
  releaseTypeReference: 'mechanical',
  bowSpeedClassReference: '301-320 FPS',
  recommendedSpinesLabel: '575-500',
  recommendedSpines: [575, 500],
  shaftFamilies: [],
  notes: [],
  confidence: 'manufacturer-table'
}
```

Les valeurs numériques ci-dessus sont uniquement un exemple de forme ; elles ne doivent être ajoutées au code réel qu'après transcription vérifiée depuis le document local.

## 2. Tracer la provenance

Chaque table doit conserver :

- `sourceFile` : chemin local exact ;
- `sourcePageLabel` : numéro visible pour un lecteur humain ;
- `sourcePageIndex` : index interne zéro-based si le moteur en a besoin ;
- `sourceSection` : titre de section ou sous-table visible ;
- `chartVersion` : version, référence produit ou révision visible ;
- `sourceUrl` : uniquement si elle est imprimée dans le document.

La provenance doit permettre de retrouver la cellule d'origine sans faire confiance à la mémoire de l'importeur.

## 3. Gérer unités et conventions

Les fabricants n'emploient pas tous les mêmes conventions. Avant toute ligne :

- noter l'unité de puissance ;
- noter l'unité de longueur ;
- noter la convention de longueur de flèche ;
- noter la convention de poids en tête :
  - pointe seule ;
  - pointe + insert ;
  - pointe + insert + collar ;
  - non précisé ;
- noter les classes de vitesse, le type de décoche et toute règle d'ajustement visible.

Si deux documents utilisent des conventions différentes, ils restent séparés même s'ils semblent parler de la même famille de tubes.

## 4. Gérer les ambiguïtés

Une ambiguïté doit être documentée, jamais résolue par intuition.

Cas typiques :

- décoche de référence non explicitée ;
- cellule difficile à lire ;
- tableau dépendant d'un autre document d'ajustement ;
- longueur de flèche non définie ;
- recommandation exprimée comme plage, famille de produit ou groupe plutôt que comme nombre unique.

Dans ces cas :

- conserver la donnée en `metadata-only` ;
- ne pas créer de `row` ;
- ajouter une note dans l'audit ou dans la documentation d'import ;
- attendre une vérification manuelle supplémentaire.

Si une cellule recommande surtout une gamme produit plutôt qu'un nombre de spine pur :

- conserver le texte exact dans `productRecommendationLabel` ;
- renseigner `recommendedSpines` uniquement lorsque les nombres de spine sont lisibles avec certitude ;
- ne jamais fabriquer un nombre à partir d'un nom de gamme ambigu.

## 5. Pourquoi les fabricants restent séparés

Les conventions de mesure, les familles de tubes, les classes de vitesse et les règles d'ajustement diffèrent selon les fabricants.  
Les fusionner dans une méga-table ferait perdre la provenance et donnerait une fausse impression d'universalité physique.

Le modèle doit donc rester :

```text
fabricant -> document -> table -> ligne vérifiée
```

et non :

```text
toutes les marques -> une table universelle
```

## 6. Pourquoi aucune cellule incertaine n'est remplie

Une cellule incertaine crée plus de dette que de valeur :

- elle peut produire une recommandation trompeuse ;
- elle rend la relecture future impossible ;
- elle donne l'illusion d'une précision absente du document.

L'absence de donnée est un résultat correct. Le simulateur doit alors retourner `no-data`.

## 7. Créer des tests

Chaque transcription future doit être accompagnée de quelques cas lus manuellement dans le document :

1. un cas qui doit matcher exactement une ligne ;
2. un cas hors plage qui doit retourner `no-data` ;
3. un cas en bord de plage ;
4. un cas pour chaque sous-table ou convention importante.

Les tests doivent vérifier :

- la source retournée ;
- la ligne effectivement matchée ;
- l'absence d'interpolation ;
- l'absence de recommandation quand la source ou la ligne n'est pas `verified`.

Quand un fabricant imprime une règle de rattachement des entrées utilisateur aux colonnes du tableau, créer deux chemins :

- un lookup strict, qui ne fait aucun arrondi et valide la transcription ;
- un lookup utilisateur, qui applique seulement la règle fabricant documentée et refuse toute extrapolation.

## 8. Construire une estimation généralisée

Le mode `Spine généralisé` n'est pas une table fabricant. Il peut agréger plusieurs fabricants uniquement si :

- les rows utilisées sont `verified` ;
- les fabricants restent séparés dans le registre source ;
- au moins plusieurs fabricants intégrés couvrent le setup ;
- l'interface le présente explicitement comme une estimation indicative à valider au tuning réel.

Il ne doit jamais utiliser :

- une source `metadata-only` ;
- une cellule incertaine ;
- l'étude scientifique pour inventer une valeur numérique.

## 9. Règles à ne jamais enfreindre

- ne jamais inventer de valeur ;
- ne jamais interpoler entre deux cellules ;
- ne jamais extrapoler hors tableau ;
- ne jamais fabriquer un spine intermédiaire ;
- ne jamais transformer l'étude scientifique en calcul de `dynamic spine number` ;
- ne jamais présenter une tendance qualitative comme une recommandation fabricant.

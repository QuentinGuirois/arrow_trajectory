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

Exemple de forme cible :

```js
{
  rowId: 'easton-target-ac-carbon-compound-40-44lb-29in',
  status: 'verified',
  sourcePage: 1,
  sourceSection: 'A/C all-carbon arrow cut length',
  criteria: {
    bowType: 'compound',
    releaseType: 'mechanical',
    speedClass: '301-320-fps',
    drawWeightLbs: { min: 40, max: 44 },
    arrowLengthIn: { min: 29, max: 29 },
    pointWeightGrains: { min: 100, max: 100 }
  },
  recommendation: {
    spines: ['575-500'],
    shaftFamilies: []
  },
  notes: []
}
```

Les valeurs numériques ci-dessus sont uniquement un exemple de forme ; elles ne doivent être ajoutées au code réel qu'après transcription vérifiée depuis le document local.

## 2. Tracer la provenance

Chaque table doit conserver :

- `sourceFile` : chemin local exact ;
- `sourcePage` : page si le document est paginé ;
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

## 8. Règles à ne jamais enfreindre

- ne jamais inventer de valeur ;
- ne jamais interpoler entre deux cellules ;
- ne jamais extrapoler hors tableau ;
- ne jamais fabriquer un spine intermédiaire ;
- ne jamais transformer l'étude scientifique en calcul de `dynamic spine number` ;
- ne jamais présenter une tendance qualitative comme une recommandation fabricant.

# Audit d'import du seed JSON spine

Source auditée : `docs/bdd_spine/bdd_spine_links_codex.json`

## 1. Charts officiels déjà entièrement transcrits

Le seed contient six charts marqués `fully_transcribed` et donc candidats à une intégration directe dans la base applicative :

| Chart ID | Fabricant | Couverture |
| --- | --- | --- |
| `easton_target_301055A_ac_all_carbon` | Easton | compound, recurve |
| `gold_tip_compound_315_plus` | Gold Tip | compound, classe IBO 315+ |
| `gold_tip_compound_315_minus` | Gold Tip | compound, classe IBO 315- |
| `gold_tip_recurve` | Gold Tip | recurve, longbow |
| `black_eagle_compound_2023` | Black Eagle | compound |
| `victory_recurve_2024` | Victory | recurve |

Ces charts embarquent déjà leurs matrices complètes, les colonnes de longueur, les classes de poids avant quand elles existent, ainsi que les notes fabricant utiles.

## 2. Sources manifest-only

Les sources suivantes sont présentes comme manifests, sans matrice prête à l'emploi dans le seed :

### Officielles à compléter si la source web est lisible

- `easton_hunting_301055A_pdf`
- `victory_arrow_guide_page`
- `carbon_express_chart_hub`
- `black_eagle_spine_chart_page`
- `skylon_target_chart_pdf`
- `skylon_hunting_chart_pdf`

### Secondaires ou non directement exploitables comme recommandation fabricant

- `three_rivers_spine_charts_pdf`
- `three_rivers_wood_chart_pdf`
- `three_rivers_dynamic_spine_calc`
- `ashby_arrow_spine_calculator`
- `stu_miller_mirror_fr`
- `arrow_builder_spreadsheet_thread`

Ces sources secondaires peuvent servir de recoupement, de note informative ou de futur mode secondaire, mais ne doivent pas alimenter une recommandation fabricant officielle.

## 3. Règles projet à préserver

- **Arrondi UX projet par défaut** : `A + 0.5 -> A`, `A + 0.6 -> A + 1`.
- **Règle spécifique Easton** : arrondi officiel à l'entier le plus proche ; exemple imprimé `28.25 -> 28`, `28.5 -> 29`.
- **Band matching rule** : une valeur intermédiaire matche la bande imprimée qui la contient, sauf borne explicitement exclusive.
- **Priorité de dimension** : un chart indexé par longueur de flèche lit `arrowLengthIn`; un chart indexé par allonge lit `drawLengthIn`; aucune conversion non documentée ne doit être inventée.

## 4. Données complémentaires présentes dans le seed

Le JSON contient aussi des jeux de spécifications produit qui ne sont pas des tables de recommandation :

- `pandarus_infinity_specs`
- `pandarus_elite_ca320_specs`
- `skylon_bentwood_specs`
- `skylon_preminens_specs`

Ils peuvent enrichir un catalogue produit futur, mais ne doivent pas être confondus avec des charts de sélection spine.

## 5. Décision d'import

### Intégration immédiate depuis le seed

À importer sans réduction de matrice :

- Easton target A/C all-carbon
- Gold Tip compound 315+
- Gold Tip compound 315-
- Gold Tip recurve
- Black Eagle compound 2023
- Victory recurve 2024

### Intégration conditionnelle depuis le web officiel

À parcourir puis intégrer seulement si la table officielle est lisible et vérifiable cellule par cellule :

- Easton hunting
- Victory compound
- Carbon Express charts
- Skylon target/hunting
- toute autre table officielle claire trouvée via les URLs déjà épinglées dans le seed

### À conserver manifest-only

À laisser manifest-only si la source est inaccessible, illisible, ambiguë, ou si elle n'est pas une vraie table de recommandation spine.

## 6. Garde-fous d'import

- Conserver `sourceUrl`, fabricant, `chartId`, section et version quand disponibles.
- Ne jamais fabriquer une cellule absente ou illisible.
- Conserver le libellé original imprimé (`575-500`, `250/235`, etc.).
- Extraire uniquement les spines numériques lisibles avec certitude.
- Une cellule `null` ne doit jamais matcher.
- Les sources secondaires ne doivent pas être promues en tables fabricant.

## 7. Résultat du parcours web officiel

Après consultation des URLs officielles épinglées dans le seed :

- **Gold Tip** : les trois charts présents dans le seed restent confirmés comme source officielle exploitable.
- **Black Eagle** : le chart compound seedé reste exploitable ; le chart traditionnel reste manifest-only tant que sa double matrice n'est pas relue exhaustivement.
- **Victory** : les deux charts compound officiels visibles sur la page 2026 ont été transcrits et importés en plus du chart recurve seedé.
- **Carbon Express** : le chart Trispine et le chart Light Recurve officiels ont été transcrits et importés ; les autres images du hub restent manifest-only jusqu'à une relecture exhaustive dédiée.
- **Easton hunting** : le PDF officiel est accessible, mais il n'est pas encore intégré tant que sa transcription cellule par cellule n'est pas relue depuis le document cible.
- **Skylon** : les charts officiels restent manifest-only car ils reposent sur des groupes intermédiaires à conserver avec leur mapping produit.

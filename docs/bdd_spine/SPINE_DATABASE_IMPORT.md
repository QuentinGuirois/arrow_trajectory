# Import de la base spine

## Principe

`docs/bdd_spine/bdd_spine_links_codex.json` sert de seed : il mélange des charts officiels déjà transcrits, des manifests de sources à compléter, des règles projet et quelques specs produit annexes.

La couche applicative sépare désormais :

- `spine-sources.js` : provenance et statut des sources ;
- `spine-database.js` : charts réellement intégrés ;
- `spine-normalizer.js` : conversion vers un format cellulaire commun ;
- `spine-lookup.js` : lookup strict et lookup UX ;
- `spine-generalized.js` : agrégation indicative des tables intégrées.

## Sources intégrées

### Depuis le seed JSON

- Easton target A/C all-carbon ;
- Gold Tip compound 315+ ;
- Gold Tip compound 315- ;
- Gold Tip recurve ;
- Black Eagle compound 2023 ;
- Victory recurve 2024.

### Depuis des sources officielles web lisibles

- Victory compound 2026, familles `VF/RIP XV/RVL` et `HLR/VLR/VAP/...` ;
- Carbon Express `Arrow Shaft Selection Chart` Trispine ;
- Carbon Express `Light Recurve Target Selection Chart`.

## Sources officielles encore manifest-only

Une source reste manifest-only lorsqu'elle est inaccessible, trop dense pour une transcription fiable relue, ou structurée avec une étape intermédiaire à préserver :

- Easton hunting ;
- Black Eagle traditional ;
- le reste de la suite Carbon Express ;
- Skylon target / hunting.

Les sources 3Rivers, Ashby, Stu Miller et Arrow Builder restent secondaires : utiles pour du recoupement ou de futures notes, jamais pour une recommandation fabricant officielle.

## Règles de résolution

- **Arrondi UX par défaut** : `A+0.5 -> A`, `A+0.6 -> A+1`.
- **Easton** : la règle officielle remplace la règle projet et arrondit à l'entier le plus proche (`28.25 -> 28`, `28.5 -> 29`).
- **Bandes de puissance** : une valeur intermédiaire tombe dans la bande imprimée correspondante, sauf borne explicitement exclusive.
- **Dimension d'entrée** : `arrowLengthIn` ou `drawLengthIn` est respecté selon le chart ; aucune conversion implicite n'est inventée.
- **Poids avant** : les colonnes de pointe ou classes de front weight sont résolues et la règle appliquée reste visible dans `resolvedInputs` / `appliedRules`.

## Modes produit

- **Mode fabricant** : retourne une recommandation issue d'une vraie table intégrée, avec source, chart et plage numérique normalisée.
- **Spine généralisé** : agrège uniquement les tables officielles intégrées compatibles avec le setup et renvoie une valeur indicative plus une fourchette commerciale proche.

Le spine alimente le tuning qualitatif via `rangeMin`, `rangeMax`, `suggestedSpine` et `currentSpineStatus`. Il ne modifie jamais la trajectoire balistique du centre de masse.

## Limites

- Une cellule absente ou incertaine reste absente.
- Les charts manifest-only ne deviennent pas des recommandations par accident.
- Les tableaux denses non encore relus doivent être importés dans un passage dédié plutôt que devinés.
- Toute recommandation reste à valider au tuning réel.

// spine-tables.js
// Base prévue pour des tables fabricant vérifiées. Aucune valeur n'est inventée ici.

export const SPINE_TABLES = {
  easton_target_recurve: {
    sourceName: 'Easton Target Shaft Selection Chart',
    sourceUrl: '',
    bowType: 'recurve',
    notes: 'À renseigner uniquement depuis une table fabricant vérifiée.',
    rows: [
      // Format prévu, à remplir depuis une source réelle vérifiée:
      // {
      //   drawWeightMinLbs: 36,
      //   drawWeightMaxLbs: 40,
      //   arrowLengthMinIn: 28,
      //   arrowLengthMaxIn: 29,
      //   pointWeightMinGrains: 90,
      //   pointWeightMaxGrains: 120,
      //   recommendedSpines: [600, 550],
      //   shaftFamilies: ['...'],
      //   sourceNote: '...'
      // }
    ]
  }
};

export function lookupRecommendedSpine(params, tableId = 'easton_target_recurve') {
  const table = SPINE_TABLES[tableId];
  if (!table?.rows?.length) {
    return {
      recommendedSpines: [],
      confidence: 'no-data',
      sourceName: table?.sourceName || '',
      sourceUrl: table?.sourceUrl || '',
      matchedRow: null,
      notes: 'Aucune table spine vérifiée disponible pour ces paramètres.'
    };
  }

  const matchedRow = table.rows.find(row =>
    params.drawWeightLbs >= row.drawWeightMinLbs &&
    params.drawWeightLbs <= row.drawWeightMaxLbs &&
    params.arrowLengthIn >= row.arrowLengthMinIn &&
    params.arrowLengthIn <= row.arrowLengthMaxIn &&
    params.pointWeightGrains >= row.pointWeightMinGrains &&
    params.pointWeightGrains <= row.pointWeightMaxGrains
  );

  if (!matchedRow) {
    return {
      recommendedSpines: [],
      confidence: 'no-data',
      sourceName: table.sourceName,
      sourceUrl: table.sourceUrl,
      matchedRow: null,
      notes: 'Aucune ligne de table ne correspond aux paramètres actuels.'
    };
  }

  return {
    recommendedSpines: matchedRow.recommendedSpines,
    confidence: 'table',
    sourceName: table.sourceName,
    sourceUrl: table.sourceUrl,
    matchedRow,
    notes: matchedRow.sourceNote || table.notes
  };
}

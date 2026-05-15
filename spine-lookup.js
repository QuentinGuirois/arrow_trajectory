// spine-lookup.js
// Deux niveaux de recherche :
// - strict : relit uniquement les cellules exactes transcrites ;
// - utilisateur : rattache les entrées réelles aux colonnes fabricant quand la règle est documentée.

import { SPINE_TABLES } from './spine-tables.js';
import { getSpineQualitativeTrends } from './spine-trends.js';

export const SPINE_UNAVAILABLE_MESSAGE =
  'Recommandation indisponible : aucune table fabricant vérifiée ne correspond à ces paramètres.';

export function lookupRecommendedSpineStrict(params = {}, tableId = params.spineTableId || '') {
  const table = tableId ? SPINE_TABLES[tableId] : null;
  const qualitativeTrends = getSpineQualitativeTrends(params);

  if (!table || !hasVerifiedRows(table)) {
    return buildStrictNoDataResult(table, qualitativeTrends);
  }

  const matchedRow = table.rows.find(row => isVerifiedRow(row) && rowMatchesParams(row, params));
  if (!matchedRow) {
    return buildStrictNoDataResult(table, qualitativeTrends);
  }

  return {
    recommendedSpines: [...matchedRow.recommendedSpines],
    recommendedSpinesLabel: matchedRow.recommendedSpinesLabel,
    confidence: 'table',
    sourceName: table.sourceName,
    sourceFile: table.sourceFile,
    sourceUrl: table.sourceUrl,
    chartVersion: table.chartVersion,
    matchedRow,
    notes: normalizeNotes(matchedRow.notes),
    qualitativeTrends,
    adjustmentRules: normalizeAdjustmentRules(table.adjustmentRules)
  };
}

// Compatibilité avec les appels et tests existants.
export const lookupRecommendedSpine = lookupRecommendedSpineStrict;

export function lookupRecommendedSpineForUser(params = {}, tableId = params.spineTableId || '') {
  const table = tableId ? SPINE_TABLES[tableId] : null;
  const qualitativeTrends = getSpineQualitativeTrends(params);

  if (!table || !hasVerifiedRows(table)) {
    return buildUserNoDataResult(table, qualitativeTrends);
  }

  const arrowLengthResolution = resolveUserArrowLength(table, params.arrowLengthIn);
  if (!arrowLengthResolution) {
    return buildUserNoDataResult(table, qualitativeTrends);
  }

  const normalizedParams = {
    ...params,
    arrowLengthIn: arrowLengthResolution.chartArrowLengthIn
  };
  const matchedRow = table.rows.find(row =>
    isVerifiedRow(row) &&
    rowMatchesUserParams(row, normalizedParams, params)
  );
  if (!matchedRow) {
    return buildUserNoDataResult(table, qualitativeTrends);
  }

  return {
    recommendedSpines: [...matchedRow.recommendedSpines],
    recommendedSpinesLabel: matchedRow.recommendedSpinesLabel,
    confidence: 'manufacturer-table',
    sourceName: table.sourceName,
    sourceFile: matchedRow.sourceFile || table.sourceFile,
    sourceUrl: table.sourceUrl,
    chartVersion: matchedRow.chartVersion || table.chartVersion,
    sourceSection: matchedRow.sourceSection,
    sourcePageLabel: matchedRow.sourcePageLabel || '',
    matchedRow,
    resolvedInputs: {
      originalArrowLengthIn: params.arrowLengthIn,
      chartArrowLengthIn: arrowLengthResolution.chartArrowLengthIn,
      originalDrawWeightLbs: params.rawDrawWeightLbs ?? params.drawWeightLbs,
      effectiveDrawWeightLbs: params.drawWeightLbs,
      matchedDrawWeightRangeLabel: matchedRow.drawWeightLabel || ''
    },
    appliedRules: arrowLengthResolution.originalArrowLengthIn === arrowLengthResolution.chartArrowLengthIn
      ? []
      : [arrowLengthResolution.note],
    notes: normalizeNotes(matchedRow.notes),
    qualitativeTrends,
    adjustmentRules: normalizeAdjustmentRules(table.adjustmentRules)
  };
}

// Nom produit explicite : lookup des tables fabricants avec rattachement des valeurs utilisateur.
export const lookupManufacturerSpineForUser = lookupRecommendedSpineForUser;

function hasVerifiedRows(table) {
  return table.status === 'verified' &&
    Array.isArray(table.rows) &&
    table.rows.some(isVerifiedRow);
}

function isVerifiedRow(row) {
  return row?.status === 'verified' &&
    row?.confidence === 'manufacturer-table' &&
    Array.isArray(row?.recommendedSpines) &&
    row.recommendedSpines.length > 0 &&
    typeof row?.recommendedSpinesLabel === 'string' &&
    row.recommendedSpinesLabel.length > 0;
}

function buildStrictNoDataResult(table, qualitativeTrends) {
  return {
    recommendedSpines: [],
    recommendedSpinesLabel: '',
    confidence: 'no-data',
    sourceName: table?.sourceName || '',
    sourceFile: table?.sourceFile || '',
    sourceUrl: table?.sourceUrl || '',
    chartVersion: table?.chartVersion || '',
    matchedRow: null,
    notes: [SPINE_UNAVAILABLE_MESSAGE],
    qualitativeTrends,
    adjustmentRules: normalizeAdjustmentRules(table?.adjustmentRules)
  };
}

function buildUserNoDataResult(table, qualitativeTrends) {
  return {
    recommendedSpines: [],
    recommendedSpinesLabel: '',
    confidence: 'no-data',
    sourceName: table?.sourceName || '',
    sourceFile: table?.sourceFile || '',
    sourceUrl: table?.sourceUrl || '',
    chartVersion: table?.chartVersion || '',
    sourceSection: '',
    sourcePageLabel: '',
    matchedRow: null,
    resolvedInputs: null,
    appliedRules: [],
    notes: ['Paramètres hors plage du tableau fabricant actuellement transcrit.'],
    qualitativeTrends,
    adjustmentRules: normalizeAdjustmentRules(table?.adjustmentRules)
  };
}

function rowMatchesParams(row, params) {
  if (!row || params.bowType !== row.bowType) return false;
  if (!matchesDrawWeight(row, params.drawWeightLbs)) return false;
  if (!matchesArrowLength(row, params.arrowLengthIn)) return false;
  if (!matchesPointWeightReference(row, params.pointWeightGrains)) return false;
  if (!matchesReleaseTypeReference(row, params.releaseType)) return false;
  if (!matchesBowSpeedClassReference(row, params.fps)) return false;
  return true;
}

function rowMatchesUserParams(row, normalizedParams, originalParams) {
  if (row.requiresAdjustedDrawWeight) {
    if (!Number.isFinite(originalParams.adjustedDrawWeightLbs)) return false;
    return rowMatchesParams(row, {
      ...normalizedParams,
      drawWeightLbs: originalParams.adjustedDrawWeightLbs
    });
  }
  return rowMatchesParams(row, normalizedParams);
}

export function matchesDrawWeight(row, actual) {
  if (!Number.isFinite(actual) || !Number.isFinite(row.drawWeightMaxLbs)) return false;
  const aboveMin = row.drawWeightMinLbs === null || actual >= row.drawWeightMinLbs;
  const belowMax = row.drawWeightMaxExclusive
    ? actual < row.drawWeightMaxLbs
    : actual <= row.drawWeightMaxLbs;
  return aboveMin && belowMax;
}

function matchesArrowLength(row, actual) {
  return Number.isFinite(actual) &&
    actual >= row.arrowLengthMinIn &&
    actual <= row.arrowLengthMaxIn;
}

function matchesPointWeightReference(row, actual) {
  if (Array.isArray(row.pointWeightReferenceRangeGrains) && row.pointWeightReferenceRangeGrains.length === 2) {
    const [min, max] = row.pointWeightReferenceRangeGrains;
    return Number.isFinite(actual) && actual >= min && actual <= max;
  }
  if (!Number.isFinite(row.pointWeightReferenceGrains)) return true;
  return Number.isFinite(actual) && actual === row.pointWeightReferenceGrains;
}

function matchesReleaseTypeReference(row, actual) {
  if (!row.releaseTypeReference) return true;
  return Boolean(actual) && normalizeReleaseType(actual) === row.releaseTypeReference;
}

function matchesBowSpeedClassReference(row, actualFps) {
  if (!row.bowSpeedClassReference) return true;
  if (!Number.isFinite(actualFps)) return false;

  const rangeMatch = row.bowSpeedClassReference.match(/(\d+)\s*-\s*(\d+)\s*FPS/i);
  if (rangeMatch) {
    return actualFps >= Number(rangeMatch[1]) && actualFps <= Number(rangeMatch[2]);
  }

  const plusMatch = row.bowSpeedClassReference.match(/(\d+)\s*\+\s*FPS/i);
  if (plusMatch) {
    return actualFps >= Number(plusMatch[1]);
  }

  const minusMatch = row.bowSpeedClassReference.match(/(\d+)\s*-\s*\(FPS\)/i);
  if (minusMatch) {
    return actualFps <= Number(minusMatch[1]);
  }

  return false;
}

function normalizeReleaseType(value) {
  if (value === 'fingers') return 'finger';
  return value;
}

function normalizeNotes(notes) {
  if (Array.isArray(notes)) return [...notes];
  if (typeof notes === 'string' && notes.trim()) return [notes];
  return [];
}

function normalizeAdjustmentRules(adjustmentRules) {
  return Array.isArray(adjustmentRules) ? adjustmentRules.map(rule => ({ ...rule })) : [];
}

function resolveUserArrowLength(table, arrowLengthIn) {
  if (!Number.isFinite(arrowLengthIn)) return null;
  if (table.columnResolutionRule === 'easton-fractional-rounding') {
    return resolveEastonArrowLengthColumn(arrowLengthIn, table);
  }

  return resolveNearestArrowLengthColumn(arrowLengthIn, table);
}

export function resolveEastonArrowLengthColumn(
  arrowLengthIn,
  table = SPINE_TABLES.easton_target_301055A_ac_all_carbon
) {
  if (!Number.isFinite(arrowLengthIn) || !table || !Array.isArray(table.rows)) return null;

  const columns = [...new Set(
    table.rows
      .filter(isVerifiedRow)
      .map(row => row.arrowLengthMinIn)
      .filter(Number.isFinite)
  )].sort((a, b) => a - b);

  if (!columns.length) return null;

  const minColumn = columns[0];
  const maxColumn = columns[columns.length - 1];
  if (arrowLengthIn < minColumn - 0.5 || arrowLengthIn >= maxColumn + 0.5) {
    return null;
  }

  const roundedColumn = Math.floor(arrowLengthIn + 0.5);
  if (!columns.includes(roundedColumn)) return null;

  return {
    chartArrowLengthIn: roundedColumn,
    rule: 'manufacturer-rounding',
    originalArrowLengthIn: arrowLengthIn,
    note: `Longueur utilisateur rattachée à la colonne ${roundedColumn}" du tableau Easton.`
  };
}

export function resolveNearestArrowLengthColumn(arrowLengthIn, table) {
  if (!Number.isFinite(arrowLengthIn) || !table || !Array.isArray(table.rows)) return null;

  const columns = [...new Set(
    table.rows
      .filter(isVerifiedRow)
      .map(row => row.arrowLengthMinIn)
      .filter(Number.isFinite)
  )].sort((a, b) => a - b);

  if (!columns.length) return null;

  const intervals = columns.map((column, index) => {
    const previous = columns[index - 1];
    const next = columns[index + 1];
    const lower = Number.isFinite(previous)
      ? midpoint(previous, column)
      : column - defaultOuterHalfWidth(column, next);
    const upper = Number.isFinite(next)
      ? midpoint(column, next)
      : column + defaultOuterHalfWidth(previous, column);
    return { column, lower, upper };
  });

  const match = intervals.find(({ lower, upper }, index) => {
    const isLast = index === intervals.length - 1;
    return arrowLengthIn >= lower && (isLast ? arrowLengthIn <= upper : arrowLengthIn < upper);
  });
  if (!match) return null;

  return {
    chartArrowLengthIn: match.column,
    rule: 'nearest-column',
    originalArrowLengthIn: arrowLengthIn,
    note: match.column === arrowLengthIn
      ? ''
      : `Longueur utilisateur rattachée à la colonne ${match.column}" du tableau fabricant.`
  };
}

function midpoint(a, b) {
  return (a + b) / 2;
}

function defaultOuterHalfWidth(a, b) {
  if (Number.isFinite(a) && Number.isFinite(b)) return Math.abs(b - a) / 2;
  return 0.5;
}

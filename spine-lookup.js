// spine-lookup.js
// Recherche stricte dans une table fabricant explicitement sélectionnée.
// Aucune fusion, interpolation, extrapolation ou valeur intermédiaire.

import { SPINE_TABLES } from './spine-tables.js';
import { getSpineQualitativeTrends } from './spine-trends.js';

export const SPINE_UNAVAILABLE_MESSAGE =
  'Recommandation indisponible : aucune table fabricant vérifiée ne correspond à ces paramètres.';

export function lookupRecommendedSpine(params = {}, tableId = params.spineTableId || '') {
  const table = tableId ? SPINE_TABLES[tableId] : null;
  const qualitativeTrends = getSpineQualitativeTrends(params);

  if (!table || !hasVerifiedRows(table)) {
    return buildNoDataResult(table, qualitativeTrends);
  }

  const matchedRow = table.rows.find(row => isVerifiedRow(row) && rowMatchesParams(row, params));
  if (!matchedRow) {
    return buildNoDataResult(table, qualitativeTrends);
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

function buildNoDataResult(table, qualitativeTrends) {
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

function rowMatchesParams(row, params) {
  if (!row || params.bowType !== row.bowType) return false;
  if (!matchesDrawWeight(row, params.drawWeightLbs)) return false;
  if (!matchesArrowLength(row, params.arrowLengthIn)) return false;
  if (!matchesPointWeightReference(row, params.pointWeightGrains)) return false;
  if (!matchesReleaseTypeReference(row, params.releaseType)) return false;
  if (!matchesBowSpeedClassReference(row, params.fps)) return false;
  return true;
}

function matchesDrawWeight(row, actual) {
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
  return actualFps >= 301 && actualFps <= 320;
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

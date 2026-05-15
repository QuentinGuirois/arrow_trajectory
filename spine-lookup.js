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
    recommendedSpines: [...matchedRow.recommendation.spines],
    confidence: 'table',
    sourceName: table.sourceName,
    sourceFile: table.sourceFile,
    sourceUrl: table.sourceUrl,
    chartVersion: table.chartVersion,
    matchedRow,
    notes: normalizeNotes(matchedRow.notes),
    qualitativeTrends
  };
}

function hasVerifiedRows(table) {
  return table.status === 'verified' &&
    Array.isArray(table.rows) &&
    table.rows.some(isVerifiedRow);
}

function isVerifiedRow(row) {
  return row?.status === 'verified' &&
    Array.isArray(row?.recommendation?.spines) &&
    row.recommendation.spines.length > 0;
}

function buildNoDataResult(table, qualitativeTrends) {
  return {
    recommendedSpines: [],
    confidence: 'no-data',
    sourceName: table?.sourceName || '',
    sourceFile: table?.sourceFile || '',
    sourceUrl: table?.sourceUrl || '',
    chartVersion: table?.chartVersion || '',
    matchedRow: null,
    notes: [SPINE_UNAVAILABLE_MESSAGE],
    qualitativeTrends
  };
}

function rowMatchesParams(row, params) {
  if (!row?.criteria) return false;

  return Object.entries(row.criteria).every(([key, expected]) => {
    const actual = params[key];
    if (actual === undefined || actual === null || actual === '') return false;

    if (isRange(expected)) {
      return typeof actual === 'number' &&
        actual >= expected.min &&
        actual <= expected.max;
    }

    if (Array.isArray(expected)) {
      return expected.includes(actual);
    }

    return actual === expected;
  });
}

function isRange(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    Number.isFinite(value.min) &&
    Number.isFinite(value.max)
  );
}

function normalizeNotes(notes) {
  if (Array.isArray(notes)) return [...notes];
  if (typeof notes === 'string' && notes.trim()) return [notes];
  return [];
}

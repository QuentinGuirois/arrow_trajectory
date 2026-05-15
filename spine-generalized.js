// spine-generalized.js
// Estimation indicative construite uniquement à partir de rows fabricant vérifiées.

import { SPINE_TABLES } from './spine-tables.js';
import { lookupManufacturerSpineForUser } from './spine-lookup.js';
import { deriveInternalReleaseType, normalizeBowType } from './bow-utils.js';
import { resolveEffectiveDrawWeight } from './draw-weight.js';

const GENERALIZED_NOTE =
  'Indication basée sur les tables fabricants intégrées. À valider au tuning réel.';
const GENERALIZED_INPUT_DOMAIN = {
  drawWeightMinLbs: 10,
  drawWeightMaxLbs: 110,
  arrowLengthMinIn: 18,
  arrowLengthMaxIn: 38
};

export function getGeneralizedSpineEstimate(params = {}) {
  const effectiveDrawWeight = Number.isFinite(params.effectiveDrawWeightLbs)
    ? {
      effectiveDrawWeightLbs: params.effectiveDrawWeightLbs,
      source: 'provided',
      notes: []
    }
    : resolveEffectiveDrawWeight(params);
  const normalizedParams = {
    ...params,
    rawDrawWeightLbs: params.rawDrawWeightLbs ?? params.drawWeightLbs,
    drawWeightLbs: effectiveDrawWeight.effectiveDrawWeightLbs,
    effectiveDrawWeightLbs: effectiveDrawWeight.effectiveDrawWeightLbs,
    bowType: normalizeGeneralizedBowType(params.bowType),
    releaseType: deriveInternalReleaseType(params.bowType)
  };

  if (!hasUsableGeneralizedInputs(normalizedParams)) {
    return buildUnavailableResult();
  }

  const exactMatches = collectExactManufacturerValues(normalizedParams);
  if (exactMatches.size) {
    return buildAvailableResult(exactMatches, 'exact');
  }

  const nearestMatches = collectNearestManufacturerValues(normalizedParams);
  if (!nearestMatches.size) {
    return buildUnavailableResult();
  }

  return buildAvailableResult(nearestMatches, 'nearest');
}

function collectExactManufacturerValues(params) {
  const byManufacturer = new Map();

  verifiedDirectTables().forEach(table => {
    const result = lookupManufacturerSpineForUser(params, table.tableId);
    if (result.confidence !== 'manufacturer-table' || !result.recommendedSpines.length) return;
    appendManufacturerValues(byManufacturer, table.manufacturer, result.recommendedSpines, result.appliedRules);
  });

  return byManufacturer;
}

function collectNearestManufacturerValues(params) {
  const byManufacturer = new Map();
  const rowsByManufacturer = new Map();

  verifiedDirectTables().forEach(table => {
    table.rows
      .filter(row =>
        isUsableGeneralizedRow(row) &&
        row.bowType === params.bowType
      )
      .forEach(row => {
        const rows = rowsByManufacturer.get(table.manufacturer) || [];
        rows.push(row);
        rowsByManufacturer.set(table.manufacturer, rows);
      });
  });

  rowsByManufacturer.forEach((rows, manufacturer) => {
    const nearest = [...rows].sort((a, b) =>
      generalizedDistance(a, params) - generalizedDistance(b, params)
    )[0];
    if (!nearest) return;
    appendManufacturerValues(byManufacturer, manufacturer, nearest.recommendedSpines, []);
  });

  return byManufacturer;
}

function buildAvailableResult(manufacturerValues, basis) {
  const sourceManufacturers = [...manufacturerValues.keys()];
  const manufacturerMeans = [...manufacturerValues.values()].map(({ rowMeans }) => average(rowMeans));
  const suggestedSpine = Math.round(average(manufacturerMeans));
  const commercialValues = uniqueSorted(
    [...manufacturerValues.values()].flatMap(({ spines }) => spines)
  );
  const nearestCommercialSpines = findNearestCommercialRange(suggestedSpine, commercialValues);
  const [rangeMin, rangeMax] = normalizeSpineRange(nearestCommercialSpines);

  if (!nearestCommercialSpines.length) {
    return buildUnavailableResult(sourceManufacturers);
  }

  return {
    status: 'available',
    suggestedSpine,
    rangeMin,
    rangeMax,
    rangeLabel: formatRangeLabel(rangeMin, rangeMax),
    nearestCommercialSpines,
    sourceManufacturers,
    basis,
    appliedRules: [...manufacturerValues.values()].flatMap(({ appliedRules }) => appliedRules),
    note: GENERALIZED_NOTE
  };
}

function buildUnavailableResult(sourceManufacturers = []) {
  return {
    status: 'unavailable',
    suggestedSpine: null,
    rangeMin: null,
    rangeMax: null,
    rangeLabel: '',
    nearestCommercialSpines: [],
    sourceManufacturers,
    basis: 'none',
    appliedRules: [],
    note: 'Spine généralisé indisponible pour ce setup.'
  };
}

function verifiedDirectTables() {
  return Object.values(SPINE_TABLES).filter(table =>
    table.status === 'verified' &&
    table.integrationRole === 'direct-spine-table' &&
    Array.isArray(table.rows) &&
    table.rows.length > 0
  );
}

function isUsableGeneralizedRow(row) {
  return row?.status === 'verified' &&
    row?.confidence === 'manufacturer-table' &&
    Array.isArray(row.recommendedSpines) &&
    row.recommendedSpines.length > 0 &&
    !row.requiresAdjustedDrawWeight;
}

function appendManufacturerValues(map, manufacturer, spines, appliedRules = []) {
  const rowAverage = average(spines);
  if (!Number.isFinite(rowAverage)) return;

  const values = map.get(manufacturer) || {
    rowMeans: [],
    spines: [],
    appliedRules: []
  };
  values.rowMeans.push(rowAverage);
  values.spines.push(...spines);
  values.appliedRules.push(...appliedRules);
  map.set(manufacturer, values);
}

function hasUsableGeneralizedInputs(params) {
  return Boolean(params.bowType) &&
    Number.isFinite(params.drawWeightLbs) &&
    Number.isFinite(params.arrowLengthIn) &&
    params.drawWeightLbs >= GENERALIZED_INPUT_DOMAIN.drawWeightMinLbs &&
    params.drawWeightLbs <= GENERALIZED_INPUT_DOMAIN.drawWeightMaxLbs &&
    params.arrowLengthIn >= GENERALIZED_INPUT_DOMAIN.arrowLengthMinIn &&
    params.arrowLengthIn <= GENERALIZED_INPUT_DOMAIN.arrowLengthMaxIn;
}

function generalizedDistance(row, params) {
  const rowDrawWeightCenter = midpoint(row.drawWeightMinLbs, row.drawWeightMaxLbs);
  const rowArrowLengthCenter = midpoint(row.arrowLengthMinIn, row.arrowLengthMaxIn);
  const pointWeightCenter = Array.isArray(row.pointWeightReferenceRangeGrains)
    ? midpoint(row.pointWeightReferenceRangeGrains[0], row.pointWeightReferenceRangeGrains[1])
    : row.pointWeightReferenceGrains;

  const drawWeightDistance = Number.isFinite(rowDrawWeightCenter)
    ? Math.abs(params.drawWeightLbs - rowDrawWeightCenter) / 8
    : 0;
  const arrowLengthDistance = Number.isFinite(rowArrowLengthCenter)
    ? Math.abs(params.arrowLengthIn - rowArrowLengthCenter) / 2
    : 0;
  const pointWeightDistance = Number.isFinite(pointWeightCenter) && Number.isFinite(params.pointWeightGrains)
    ? Math.abs(params.pointWeightGrains - pointWeightCenter) / 50
    : 0;

  return drawWeightDistance + arrowLengthDistance + pointWeightDistance;
}

function normalizeGeneralizedBowType(value = '') {
  const normalized = normalizeBowType(value);
  return normalized === 'traditional' ? 'recurve' : normalized;
}

function average(values) {
  if (!values.length) return NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function midpoint(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return NaN;
  return (min + max) / 2;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Number.isFinite))].sort((a, b) => a - b);
}

function normalizeSpineRange(values = []) {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return [null, null];
  return [Math.min(...finite), Math.max(...finite)];
}

function findNearestCommercialRange(suggestedSpine, values) {
  if (!Number.isFinite(suggestedSpine) || !values.length) return [];
  const lower = [...values].reverse().find(value => value <= suggestedSpine);
  const upper = values.find(value => value >= suggestedSpine);

  if (Number.isFinite(lower) && Number.isFinite(upper)) {
    return lower === upper ? [lower] : [lower, upper];
  }
  if (Number.isFinite(lower)) return [lower];
  if (Number.isFinite(upper)) return [upper];
  return [];
}

function formatRangeLabel(rangeMin, rangeMax) {
  if (!Number.isFinite(rangeMin) || !Number.isFinite(rangeMax)) return '';
  return rangeMin === rangeMax ? `${rangeMin}` : `${rangeMin}–${rangeMax}`;
}

// spine-generalized.js
// Estimation indicative construite depuis les charts réellement intégrés.

import { SPINE_CHARTS } from './spine-database.js';
import { lookupRecommendedSpineForUser } from './spine-lookup.js';
import { deriveInternalReleaseType, normalizeBowType } from './bow-utils.js';
import { resolveEffectiveDrawWeight } from './draw-weight.js';

const GENERALIZED_NOTE =
  'Indication basée sur les tables intégrées. À valider au tuning réel.';

export function getGeneralizedSpineEstimate(params = {}) {
  const effectiveDrawWeight = Number.isFinite(params.effectiveDrawWeightLbs)
    ? params.effectiveDrawWeightLbs
    : resolveEffectiveDrawWeight(params).effectiveDrawWeightLbs;
  const normalizedParams = {
    ...params,
    rawDrawWeightLbs: params.rawDrawWeightLbs ?? params.drawWeightLbs,
    drawWeightLbs: effectiveDrawWeight,
    effectiveDrawWeightLbs: effectiveDrawWeight,
    bowType: normalizeGeneralizedBowType(params.bowType),
    releaseType: deriveInternalReleaseType(params.bowType)
  };

  const exact = collectExactMatches(normalizedParams);
  if (exact.size) return buildAvailableResult(exact, 'exact');

  const nearest = collectNearestMatches(normalizedParams);
  if (nearest.size) return buildAvailableResult(nearest, 'nearest');

  return buildUnavailableResult();
}

function collectExactMatches(params) {
  const byManufacturer = new Map();
  integratedCharts().forEach(chart => {
    const result = lookupRecommendedSpineForUser(params, chart.chartId);
    if (result.status !== 'available') return;
    appendManufacturerValues(byManufacturer, chart.manufacturer, result);
  });
  return byManufacturer;
}

function collectNearestMatches(params) {
  const byManufacturer = new Map();
  const rowsByManufacturer = new Map();
  integratedCharts().forEach(chart => {
    chart.rows
      .filter(row =>
        row.bowType === params.bowType &&
        row.confidence === 'manufacturer-table' &&
        row.recommendedSpines.length &&
        (!row.requiresAdjustedDrawWeight || Number.isFinite(params.adjustedDrawWeightLbs))
      )
      .forEach(row => {
        const rows = rowsByManufacturer.get(chart.manufacturer) || [];
        rows.push(row);
        rowsByManufacturer.set(chart.manufacturer, rows);
      });
  });

  rowsByManufacturer.forEach((rows, manufacturer) => {
    const nearest = [...rows].sort((a, b) => generalizedDistance(a, params) - generalizedDistance(b, params))[0];
    if (!nearest) return;
    appendManufacturerValues(byManufacturer, manufacturer, {
      recommendedSpines: nearest.recommendedSpines,
      appliedRules: []
    });
  });
  return byManufacturer;
}

function buildAvailableResult(manufacturerValues, basis) {
  const sourceManufacturers = [...manufacturerValues.keys()];
  const means = [...manufacturerValues.values()].map(value => average(value.rowMeans));
  const suggestedSpine = Math.round(average(means));
  const commercialValues = uniqueSorted([...manufacturerValues.values()].flatMap(value => value.spines));
  const nearestCommercial = nearestCommercialRange(suggestedSpine, commercialValues);
  const [rangeMin, rangeMax] = nearestCommercial.length
    ? [Math.min(...nearestCommercial), Math.max(...nearestCommercial)]
    : [null, null];

  return {
    status: 'available',
    mode: 'generalized',
    suggestedSpine,
    rangeMin,
    rangeMax,
    rangeLabel: formatRangeLabel(rangeMin, rangeMax),
    recommendedSpines: nearestCommercial,
    nearestCommercialSpines: nearestCommercial,
    sourceManufacturers,
    basis,
    appliedRules: [...manufacturerValues.values()].flatMap(value => value.appliedRules),
    note: GENERALIZED_NOTE
  };
}

function buildUnavailableResult() {
  return {
    status: 'unavailable',
    mode: 'generalized',
    suggestedSpine: null,
    rangeMin: null,
    rangeMax: null,
    rangeLabel: '',
    recommendedSpines: [],
    nearestCommercialSpines: [],
    sourceManufacturers: [],
    basis: 'none',
    appliedRules: [],
    note: 'Spine généralisé indisponible pour ce setup.'
  };
}

function integratedCharts() {
  return SPINE_CHARTS.filter(chart => chart.status === 'fully_transcribed' && chart.rows.length);
}

function appendManufacturerValues(map, manufacturer, result) {
  const values = map.get(manufacturer) || { rowMeans: [], spines: [], appliedRules: [] };
  const mean = average(result.recommendedSpines);
  if (!Number.isFinite(mean)) return;
  values.rowMeans.push(mean);
  values.spines.push(...result.recommendedSpines);
  values.appliedRules.push(...(result.appliedRules || []));
  map.set(manufacturer, values);
}

function generalizedDistance(row, params) {
  const drawCenter = midpoint(row.drawWeightMinLbs, row.drawWeightMaxLbs);
  const lengthCenter = midpoint(row.arrowLengthMinIn, row.arrowLengthMaxIn);
  const drawDistance = Number.isFinite(drawCenter) ? Math.abs(params.drawWeightLbs - drawCenter) / 8 : 0;
  const lengthDistance = Number.isFinite(lengthCenter) ? Math.abs(params.arrowLengthIn - lengthCenter) / 2 : 0;
  return drawDistance + lengthDistance;
}

function normalizeGeneralizedBowType(value = '') {
  const normalized = normalizeBowType(value);
  return normalized === 'traditional' ? 'traditional' : normalized;
}

function nearestCommercialRange(suggestedSpine, values) {
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

function uniqueSorted(values) {
  return [...new Set(values.filter(Number.isFinite))].sort((a, b) => a - b);
}

function average(values) {
  if (!values.length) return NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function midpoint(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return NaN;
  return (min + max) / 2;
}

function formatRangeLabel(rangeMin, rangeMax) {
  if (!Number.isFinite(rangeMin) || !Number.isFinite(rangeMax)) return '';
  return rangeMin === rangeMax ? `${rangeMin}` : `${rangeMin}–${rangeMax}`;
}

// spine-lookup.js
// Lookup strict pour valider la transcription, lookup utilisateur pour l'UX réelle.

import { SPINE_TABLES } from './spine-tables.js';
import { SPINE_CHARTS } from './spine-database.js';
import { getSpineQualitativeTrends } from './spine-trends.js';

export const SPINE_UNAVAILABLE_MESSAGE =
  'Recommandation indisponible pour ce setup.';

const MANUFACTURER_REFERENCES = {
  easton: 'Easton',
  goldtip: 'Gold Tip',
  blackeagle: 'Black Eagle',
  victory: 'Victory',
  carbonexpress: 'Carbon Express',
  skylon: 'Skylon'
};

export function lookupRecommendedSpineStrict(params = {}, tableId = params.spineTableId || '') {
  const table = resolveTable(tableId);
  const qualitativeTrends = getSpineQualitativeTrends(params);
  if (!isUsableTable(table)) return buildLegacyUnavailable(table, qualitativeTrends);

  const matchedRow = table.rows.find(row => strictRowMatches(row, params, table));
  if (!matchedRow) return buildLegacyUnavailable(table, qualitativeTrends);
  return buildLegacyAvailable(table, matchedRow, qualitativeTrends);
}

export const lookupRecommendedSpine = lookupRecommendedSpineStrict;

export function lookupRecommendedSpineForUser(params = {}, tableId = params.spineTableId || '') {
  const table = resolveTable(tableId);
  const qualitativeTrends = getSpineQualitativeTrends(params);
  if (!isUsableTable(table)) return buildUserUnavailable(table, qualitativeTrends);
  return lookupUserOnTable(params, table, qualitativeTrends);
}

export function lookupManufacturerSpineForUser(params = {}, reference = params.spineReference || '') {
  if (resolveTable(reference)) {
    return lookupRecommendedSpineForUser(params, reference);
  }

  const manufacturer = MANUFACTURER_REFERENCES[reference] || reference;
  const candidates = SPINE_CHARTS
    .filter(chart =>
      chart.manufacturer === manufacturer &&
      chart.status === 'fully_transcribed' &&
      chart.bowTypes.includes(normalizeLookupBowType(params.bowType)) &&
      chartMatchesSelectionSpeed(chart, params)
    )
    .sort((a, b) => chartPriority(a, params) - chartPriority(b, params));

  for (const chart of candidates) {
    const result = lookupUserOnTable(params, SPINE_TABLES[chart.chartId], getSpineQualitativeTrends(params));
    if (result.status === 'available') return result;
  }

  return buildUserUnavailable(
    { manufacturer, chartId: '', chartTitle: '', chartVersion: '', sourceUrl: '' },
    getSpineQualitativeTrends(params)
  );
}

export function resolveOfficialEastonArrowLengthColumn(
  arrowLengthIn,
  table = SPINE_TABLES.easton_target_301055A_ac_all_carbon
) {
  return resolveRoundedLengthColumn(arrowLengthIn, table, value => Math.floor(value + 0.5), 'official-nearest-whole-inch');
}

export function resolveProjectArrowLengthColumn(arrowLengthIn, table) {
  return resolveRoundedLengthColumn(
    arrowLengthIn,
    table,
    value => {
      const whole = Math.floor(value);
      return value - whole >= 0.6 ? whole + 1 : whole;
    },
    'project-floor-until-0-5'
  );
}

export const resolveEastonArrowLengthColumn = resolveOfficialEastonArrowLengthColumn;

export function matchesDrawWeight(row, actual) {
  if (!Number.isFinite(actual) || !Number.isFinite(row.drawWeightMaxLbs)) return false;
  const aboveMin = row.drawWeightMinLbs === null || actual >= row.drawWeightMinLbs;
  const belowMax = row.drawWeightMaxExclusive
    ? actual < row.drawWeightMaxLbs
    : actual <= row.drawWeightMaxLbs;
  return aboveMin && belowMax;
}

function lookupUserOnTable(params, table, qualitativeTrends) {
  const normalizedBowType = normalizeLookupBowType(params.bowType);
  const lengthResolution = resolveLengthForTable(table, params);
  if (!lengthResolution) return buildUserUnavailable(table, qualitativeTrends);

  const weightResolution = resolveWeightDimension(table, params);
  if (!weightResolution) return buildUserUnavailable(table, qualitativeTrends);

  const drawWeightLbs = Number.isFinite(params.adjustedDrawWeightLbs) && table.rows.some(row => row.requiresAdjustedDrawWeight)
    ? params.adjustedDrawWeightLbs
    : params.drawWeightLbs;

  const matchedRow = table.rows.find(row =>
    row.bowType === normalizedBowType &&
    row.arrowLengthMinIn === lengthResolution.chartLengthIn &&
    (!row.requiresAdjustedDrawWeight || Number.isFinite(params.adjustedDrawWeightLbs)) &&
    matchesDrawWeight(row, drawWeightLbs) &&
    matchesWeightClass(row, weightResolution) &&
    rowMatchesSpeed(row, params) &&
    rowMatchesRelease(row, params)
  );

  if (!matchedRow) return buildUserUnavailable(table, qualitativeTrends);

  const appliedRules = [
    ...(lengthResolution.note ? [lengthResolution.note] : []),
    ...(weightResolution.note ? [weightResolution.note] : []),
    ...(matchedRow.requiresAdjustedDrawWeight
      ? ['Poids ajusté Carbon Express utilisé pour la table.']
      : [])
  ];

  return buildNormalizedRecommendation({
    table,
    matchedRow,
    params,
    resolvedInputs: {
      originalArrowLengthIn: params.arrowLengthIn,
      originalDrawLengthIn: params.drawLengthIn,
      chartArrowLengthIn: table.inputDimension === 'arrowLengthIn' ? lengthResolution.chartLengthIn : null,
      chartDrawLengthIn: table.inputDimension === 'drawLengthIn' ? lengthResolution.chartLengthIn : null,
      originalDrawWeightLbs: params.rawDrawWeightLbs ?? params.drawWeightLbs,
      effectiveDrawWeightLbs: drawWeightLbs,
      matchedDrawWeightRangeLabel: matchedRow.drawWeightLabel,
      pointWeightUsedGr: weightResolution.pointWeightUsedGr ?? null,
      frontWeightUsedGr: weightResolution.frontWeightUsedGr ?? null,
      pointWeightColumnGr: weightResolution.pointWeightColumnGr ?? null,
      frontWeightClassGr: weightResolution.frontWeightClassGr ?? null
    },
    appliedRules,
    qualitativeTrends
  });
}

function buildNormalizedRecommendation({
  table,
  matchedRow,
  params,
  resolvedInputs,
  appliedRules,
  qualitativeTrends
}) {
  const recommendedSpines = [...matchedRow.recommendedSpines];
  const suggestedSpine = recommendedSpines.length === 1
    ? recommendedSpines[0]
    : Math.round(average(recommendedSpines));
  return {
    status: 'available',
    mode: 'manufacturer',
    manufacturer: table.manufacturer,
    chartId: table.chartId,
    sourceLabel: table.manufacturer,
    sourceUrl: table.sourceUrl,
    displayLabel: matchedRow.recommendedSpinesLabel,
    suggestedSpine,
    rangeMin: matchedRow.rangeMin,
    rangeMax: matchedRow.rangeMax,
    rangeLabel: formatRangeLabel(matchedRow.rangeMin, matchedRow.rangeMax),
    recommendedSpines,
    recommendedSpinesLabel: matchedRow.recommendedSpinesLabel,
    productRecommendationLabel: matchedRow.productRecommendationLabel,
    matchedRow,
    resolvedInputs,
    appliedRules,
    notes: [...matchedRow.notes],
    sourceSection: matchedRow.sourceSection,
    chartVersion: matchedRow.chartVersion,
    qualitativeTrends,
    confidence: 'manufacturer-table'
  };
}

function buildLegacyAvailable(table, matchedRow, qualitativeTrends) {
  return {
    recommendedSpines: [...matchedRow.recommendedSpines],
    recommendedSpinesLabel: matchedRow.recommendedSpinesLabel,
    confidence: 'table',
    sourceName: table.sourceName,
    sourceFile: table.sourceFile || '',
    sourceUrl: table.sourceUrl || '',
    chartVersion: table.chartVersion || '',
    matchedRow,
    notes: [...(matchedRow.notes || [])],
    qualitativeTrends,
    adjustmentRules: [...(table.adjustmentRules || [])]
  };
}

function buildLegacyUnavailable(table, qualitativeTrends) {
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
    adjustmentRules: [...(table?.adjustmentRules || [])]
  };
}

function buildUserUnavailable(table, qualitativeTrends) {
  return {
    status: 'unavailable',
    mode: 'manufacturer',
    manufacturer: table?.manufacturer || '',
    chartId: table?.chartId || '',
    sourceLabel: table?.manufacturer || '',
    sourceUrl: table?.sourceUrl || '',
    displayLabel: '',
    suggestedSpine: null,
    rangeMin: null,
    rangeMax: null,
    rangeLabel: '',
    recommendedSpines: [],
    recommendedSpinesLabel: '',
    productRecommendationLabel: '',
    matchedRow: null,
    resolvedInputs: null,
    appliedRules: [],
    notes: [SPINE_UNAVAILABLE_MESSAGE],
    qualitativeTrends,
    confidence: 'no-data'
  };
}

function strictRowMatches(row, params, table) {
  const bowType = normalizeLookupBowType(params.bowType);
  const rawLength = row.arrowLengthMinIn;
  const weightResolution = resolveWeightDimension(table, params, true);
  return row.status === 'verified' &&
    row.confidence === 'manufacturer-table' &&
    row.bowType === bowType &&
    params.arrowLengthIn === rawLength &&
    matchesDrawWeight(row, params.drawWeightLbs) &&
    (!tableNeedsWeightDimension(table) || Boolean(weightResolution)) &&
    (!weightResolution || matchesWeightClass(row, weightResolution)) &&
    rowMatchesSpeed(row, params) &&
    rowMatchesRelease(row, params);
}

function resolveTable(tableId) {
  return tableId ? SPINE_TABLES[tableId] || null : null;
}

function isUsableTable(table) {
  return Boolean(
    table &&
    table.status === 'verified' &&
    Array.isArray(table.rows) &&
    table.rows.some(row => row.status === 'verified' && row.confidence === 'manufacturer-table')
  );
}

function resolveLengthForTable(table, params) {
  const value = table.inputDimension === 'drawLengthIn' ? params.drawLengthIn : params.arrowLengthIn;
  if (table.columnResolutionRule === 'official-nearest-whole-inch') {
    return resolveOfficialEastonArrowLengthColumn(value, table);
  }
  return resolveProjectArrowLengthColumn(value, table);
}

function resolveRoundedLengthColumn(value, table, resolver, rule) {
  if (!Number.isFinite(value) || !Array.isArray(table?.rows)) return null;
  const columns = [...new Set(table.rows.map(row => row.arrowLengthMinIn).filter(Number.isFinite))].sort((a, b) => a - b);
  if (!columns.length) return null;
  const min = columns[0];
  const max = columns[columns.length - 1];
  if (value < min || value > max + 0.59) return null;
  const resolved = resolver(value);
  if (!columns.includes(resolved)) return null;
  return {
    chartLengthIn: resolved,
    rule,
    note: resolved === value
      ? ''
      : `Longueur rattachée à la colonne ${resolved}" selon la règle ${rule}.`
  };
}

function resolveWeightDimension(table, params, strict = false) {
  const pointWeightTotalGr = computeFrontWeight(params);

  if (Number.isFinite(table.pointWeightBaselineGr)) {
    const actualPointWeight = params.pointWeightGrains;
    if (!Number.isFinite(actualPointWeight)) return null;
    if (strict && actualPointWeight !== table.pointWeightBaselineGr) return null;
    return {
      pointWeightUsedGr: actualPointWeight,
      pointWeightColumnGr: table.pointWeightBaselineGr,
      note: actualPointWeight === table.pointWeightBaselineGr
        ? ''
        : `Poids de pointe ${actualPointWeight} gr rattaché à la base ${table.pointWeightBaselineGr} gr.`
    };
  }

  if (table.pointWeightColumnsGr?.length) {
    const column = chooseNearestNumericClass(pointWeightTotalGr, table.pointWeightColumnsGr, strict);
    if (!Number.isFinite(column)) return null;
    return {
      pointWeightUsedGr: pointWeightTotalGr,
      pointWeightColumnGr: column,
      note: column === pointWeightTotalGr
        ? ''
        : `Poids avant ${pointWeightTotalGr} gr rattaché à la colonne ${column} gr.`
    };
  }

  if (table.frontWeightClassesGr?.length) {
    const classLabel = chooseFrontWeightClass(pointWeightTotalGr, table.frontWeightClassesGr, strict);
    if (!classLabel) return null;
    return {
      frontWeightUsedGr: pointWeightTotalGr,
      frontWeightClassGr: classLabel,
      note: classContainsValue(classLabel, pointWeightTotalGr)
        ? ''
        : `Poids avant ${pointWeightTotalGr} gr rattaché à la classe ${classLabel}.`
    };
  }

  return {};
}

function computeFrontWeight(params) {
  return [
    params.pointWeightGrains,
    params.insertWeightGrains,
    params.outsertWeightGrains,
    params.collarWeightGrains,
    params.factWeightGrains
  ].filter(Number.isFinite).reduce((sum, value) => sum + value, 0);
}

function chooseNearestNumericClass(value, classes, strict) {
  if (!Number.isFinite(value) || !classes.length) return null;
  if (strict) return classes.includes(value) ? value : null;
  return [...classes].sort((a, b) => Math.abs(a - value) - Math.abs(b - value))[0];
}

function chooseFrontWeightClass(value, classes, strict) {
  if (!Number.isFinite(value) || !classes.length) return null;
  const exact = classes
    .filter(label => classContainsValue(label, value))
    .sort((a, b) => classLowerBound(b) - classLowerBound(a))[0];
  if (exact) return exact;
  if (strict) return null;
  return [...classes].sort((a, b) => distanceToClass(value, a) - distanceToClass(value, b))[0];
}

function classContainsValue(label, value) {
  const range = label.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) return value >= Number(range[1]) && value <= Number(range[2]);
  const plus = label.match(/^(\d+)\+$/);
  if (plus) return value >= Number(plus[1]);
  return false;
}

function distanceToClass(value, label) {
  const range = label.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    if (value < min) return min - value;
    if (value > max) return value - max;
    return 0;
  }
  const plus = label.match(/^(\d+)\+$/);
  if (plus) {
    const min = Number(plus[1]);
    return value >= min ? 0 : min - value;
  }
  return Number.POSITIVE_INFINITY;
}

function classLowerBound(label) {
  const range = label.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) return Number(range[1]);
  const plus = label.match(/^(\d+)\+$/);
  if (plus) return Number(plus[1]);
  return Number.NEGATIVE_INFINITY;
}

function matchesWeightClass(row, resolution) {
  if (Number.isFinite(row.pointWeightClassGr)) {
    return row.pointWeightClassGr === resolution.pointWeightColumnGr;
  }
  if (row.frontWeightClassGr) {
    return row.frontWeightClassGr === resolution.frontWeightClassGr;
  }
  return true;
}

function rowMatchesSpeed(row, params) {
  if (!row.bowSpeedClassReference) return true;
  const fps = Number.isFinite(params.bowRatingFps) ? params.bowRatingFps : params.fps;
  if (!Number.isFinite(fps)) return false;
  return speedMatchesLabel(fps, row.bowSpeedClassReference);
}

function chartMatchesSelectionSpeed(chart, params) {
  if (!chart.speedClass) return true;
  const fps = Number.isFinite(params.bowRatingFps) ? params.bowRatingFps : params.fps;
  if (!Number.isFinite(fps)) return true;
  return speedMatchesLabel(fps, chart.speedClass);
}

function speedMatchesLabel(fps, label) {
  const plus = label.match(/(\d+)\s*\+/);
  if (plus) return fps >= Number(plus[1]);
  const minus = label.match(/(\d+)\s*-\s*(?:\(?FPS\)?)?/i);
  if (minus && !label.match(/(\d+)\s*-\s*(\d+)/)) return fps <= Number(minus[1]);
  const range = label.match(/(\d+)\s*-\s*(\d+)/);
  if (range) return fps >= Number(range[1]) && fps <= Number(range[2]);
  return true;
}

function rowMatchesRelease(row, params) {
  if (!row.releaseTypeReference) return true;
  return normalizeReleaseType(params.releaseType) === row.releaseTypeReference;
}

function normalizeReleaseType(value) {
  return value === 'fingers' ? 'finger' : value;
}

function normalizeLookupBowType(value) {
  return value === 'longbow' ? 'traditional' : value;
}

function chartPriority(chart, params) {
  if (chart.manufacturer === 'Gold Tip') {
    if (/315\+/.test(chart.speedClass)) return 0;
    if (/315-/.test(chart.speedClass)) return 1;
  }
  if (chart.manufacturer === 'Victory') {
    return chart.chartId.includes('hlr') ? 0 : 1;
  }
  return 0;
}

function tableNeedsWeightDimension(table) {
  return Boolean(
    Number.isFinite(table?.pointWeightBaselineGr) ||
    table?.pointWeightColumnsGr?.length ||
    table?.frontWeightClassesGr?.length
  );
}

function average(values) {
  if (!values.length) return NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatRangeLabel(rangeMin, rangeMax) {
  if (!Number.isFinite(rangeMin) || !Number.isFinite(rangeMax)) return '';
  return rangeMin === rangeMax ? `${rangeMin}` : `${rangeMin}–${rangeMax}`;
}

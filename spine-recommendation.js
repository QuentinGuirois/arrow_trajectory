// spine-recommendation.js
// Résolution unique du conseil affiché dans l'UI et consommé par les diagnostics tuning.

import { SPINE_TABLES } from './spine-tables.js';
import { lookupManufacturerSpineForUser } from './spine-lookup.js';
import { getGeneralizedSpineEstimate } from './spine-generalized.js';
import { compareCurrentSpineToRecommendation } from './spine-evaluation.js';
import { deriveInternalReleaseType, normalizeBowType } from './bow-utils.js';
import { resolveEffectiveDrawWeight } from './draw-weight.js';

const MANUFACTURER_LABELS = {
  easton: 'Easton',
  victory: 'Victory Archery',
  carbonexpress: 'Carbon Express',
  goldtip: 'Gold Tip'
};

export function resolveSpineRecommendation(params = {}) {
  const effectiveDrawWeight = resolveEffectiveDrawWeight(params);
  const normalizedParams = {
    ...params,
    rawDrawWeightLbs: params.drawWeightLbs,
    drawWeightLbs: effectiveDrawWeight.effectiveDrawWeightLbs,
    effectiveDrawWeightLbs: effectiveDrawWeight.effectiveDrawWeightLbs,
    bowType: normalizeBowType(params.bowType),
    releaseType: deriveInternalReleaseType(params.bowType)
  };
  const reference = params.spineReference || 'generalized';
  const result = reference === 'generalized'
    ? buildGeneralizedRecommendation(normalizedParams)
    : buildManufacturerRecommendation(reference, normalizedParams);

  const currentSpine = compareCurrentSpineToRecommendation(
    params.spineStatic,
    result.rangeMin,
    result.rangeMax
  );

  return {
    ...result,
    currentSpineStatus: currentSpine.status,
    notes: [
      `Puissance utilisée pour le spine : ${formatWeight(effectiveDrawWeight.effectiveDrawWeightLbs)} lbs.`,
      ...effectiveDrawWeight.notes,
      ...(result.notes || [])
    ]
  };
}

export function getManufacturerReferenceLabel(reference) {
  return MANUFACTURER_LABELS[reference] || reference;
}

function buildGeneralizedRecommendation(params) {
  const estimate = getGeneralizedSpineEstimate(params);
  return {
    status: estimate.status,
    mode: 'generalized',
    sourceLabel: 'Spine généralisé',
    suggestedSpine: estimate.suggestedSpine,
    rangeMin: estimate.rangeMin,
    rangeMax: estimate.rangeMax,
    rangeLabel: estimate.rangeLabel,
    displayLabel: estimate.status === 'available'
      ? `Spine conseillé : ${estimate.suggestedSpine}`
      : 'Spine conseillé indisponible',
    appliedRules: estimate.appliedRules || [],
    notes: [estimate.note],
    sourceManufacturers: estimate.sourceManufacturers,
    basis: estimate.basis,
    nearestCommercialSpines: estimate.nearestCommercialSpines
  };
}

function buildManufacturerRecommendation(reference, params) {
  const manufacturerLabel = getManufacturerReferenceLabel(reference);
  const candidates = Object.values(SPINE_TABLES).filter(table =>
    table.manufacturer === manufacturerLabel &&
    table.status === 'verified' &&
    table.integrationRole === 'direct-spine-table' &&
    table.bowTypes.includes(params.bowType)
  );

  const matches = candidates
    .map(table => lookupManufacturerSpineForUser(params, table.tableId))
    .filter(result => result.confidence === 'manufacturer-table');

  if (!matches.length) {
    return buildUnavailableManufacturerRecommendation(reference, manufacturerLabel);
  }

  const numericValues = uniqueSorted(matches.flatMap(match => match.recommendedSpines));
  const [rangeMin, rangeMax] = normalizeSpineRange(numericValues);
  const labelValues = [...new Set(matches.map(match => match.recommendedSpinesLabel).filter(Boolean))];
  const representative = matches[0];

  if (!numericValues.length) {
    return {
      status: 'available',
      mode: 'manufacturer',
      sourceLabel: manufacturerLabel,
      suggestedSpine: null,
      rangeMin: null,
      rangeMax: null,
      rangeLabel: '',
      displayLabel: `Recommandation ${manufacturerLabel} : ${labelValues.join(' / ')}`,
      appliedRules: matches.flatMap(match => match.appliedRules || []),
      notes: ['Recommandation fabricant sans plage numérique exploitable pour le tuning.'],
      reference,
      manufacturerLabel,
      matchedRows: matches.map(match => match.matchedRow),
      matchedRow: representative.matchedRow,
      resolvedInputs: representative.resolvedInputs
    };
  }

  return {
    status: 'available',
    mode: 'manufacturer',
    sourceLabel: manufacturerLabel,
    suggestedSpine: null,
    rangeMin,
    rangeMax,
    rangeLabel: formatRangeLabel(rangeMin, rangeMax),
    displayLabel: `Recommandation ${manufacturerLabel} : ${labelValues.join(' / ')}`,
    appliedRules: matches.flatMap(match => match.appliedRules || []),
    notes: ['À valider au tuning réel.'],
    reference,
    manufacturerLabel,
    matchedRows: matches.map(match => match.matchedRow),
    matchedRow: representative.matchedRow,
    sourceName: representative.sourceName,
    sourceSection: representative.sourceSection,
    sourcePageLabel: representative.sourcePageLabel,
    chartVersion: representative.chartVersion,
    resolvedInputs: representative.resolvedInputs
  };
}

function buildUnavailableManufacturerRecommendation(reference, manufacturerLabel) {
  return {
    status: 'unavailable',
    mode: 'manufacturer',
    sourceLabel: manufacturerLabel,
    suggestedSpine: null,
    rangeMin: null,
    rangeMax: null,
    rangeLabel: '',
    displayLabel: `Recommandation ${manufacturerLabel} indisponible`,
    appliedRules: [],
    notes: [`Recommandation ${manufacturerLabel} indisponible pour ce setup.`],
    reference,
    manufacturerLabel
  };
}

function normalizeSpineRange(values = []) {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return [null, null];
  return [Math.min(...finite), Math.max(...finite)];
}

function uniqueSorted(values = []) {
  return [...new Set(values.filter(Number.isFinite))].sort((a, b) => a - b);
}

function formatRangeLabel(rangeMin, rangeMax) {
  if (!Number.isFinite(rangeMin) || !Number.isFinite(rangeMax)) return '';
  return rangeMin === rangeMax ? `${rangeMin}` : `${rangeMin}–${rangeMax}`;
}

function formatWeight(value) {
  if (!Number.isFinite(value)) return '—';
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

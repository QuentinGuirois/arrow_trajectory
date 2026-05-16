// spine-recommendation.js
// Résolution unique du conseil consommé par l'UI et le tuning.

import { lookupManufacturerSpineForUser } from './spine-lookup.js';
import { getGeneralizedSpineEstimate } from './spine-generalized.js';
import { compareCurrentSpineToRecommendation } from './spine-evaluation.js';
import { deriveInternalReleaseType, normalizeBowType } from './bow-utils.js';
import { resolveEffectiveDrawWeight } from './draw-weight.js';

const MANUFACTURER_LABELS = {
  easton: 'Easton',
  goldtip: 'Gold Tip',
  blackeagle: 'Black Eagle',
  victory: 'Victory',
  carbonexpress: 'Carbon Express',
  skylon: 'Skylon'
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
  const base = reference === 'generalized'
    ? buildGeneralizedRecommendation(normalizedParams)
    : lookupManufacturerSpineForUser(normalizedParams, reference);

  const comparison = compareCurrentSpineToRecommendation(
    params.spineStatic,
    base.rangeMin,
    base.rangeMax
  );

  return {
    ...base,
    currentSpineStatus: comparison.status,
    notes: [
      `Puissance utilisée pour le spine : ${formatWeight(effectiveDrawWeight.effectiveDrawWeightLbs)} lbs.`,
      ...effectiveDrawWeight.notes,
      ...(base.notes || []),
      ...(base.status === 'available' && !(base.notes || []).some(note => note.includes('À valider au tuning réel.'))
        ? ['À valider au tuning réel.']
        : [])
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
    manufacturer: '',
    chartId: '',
    sourceLabel: 'Spine généralisé',
    displayLabel: estimate.status === 'available'
      ? `${estimate.suggestedSpine}`
      : '',
    suggestedSpine: estimate.suggestedSpine,
    rangeMin: estimate.rangeMin,
    rangeMax: estimate.rangeMax,
    rangeLabel: estimate.rangeLabel,
    recommendedSpines: estimate.recommendedSpines,
    productRecommendationLabel: '',
    matchedRow: null,
    resolvedInputs: null,
    appliedRules: estimate.appliedRules,
    notes: [estimate.note],
    sourceManufacturers: estimate.sourceManufacturers,
    basis: estimate.basis,
    nearestCommercialSpines: estimate.nearestCommercialSpines
  };
}

function formatWeight(value) {
  if (!Number.isFinite(value)) return '—';
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

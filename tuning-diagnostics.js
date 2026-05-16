// tuning-diagnostics.js
// Diagnostics comparatifs séparés de la trajectoire du centre de masse.
// L'étude locale rappelle que le spine statique seul ne résume pas la dynamique :
// masse, raideur, amortissement et fréquence propre comptent aussi.

import { clamp } from './units.js';
import { computeSpineMismatch, spineMismatchMessage } from './spine-evaluation.js';
import { deriveInternalReleaseType } from './bow-utils.js';
import { resolveEffectiveDrawWeight } from './draw-weight.js';

export function computeDynamicTuningInputs(params = {}, spineRecommendation = {}) {
  const effectiveDrawWeight = Number.isFinite(params.effectiveDrawWeightLbs)
    ? params.effectiveDrawWeightLbs
    : resolveEffectiveDrawWeight(params).effectiveDrawWeightLbs;
  const spineMismatch = computeSpineMismatch(
    params.spineStatic,
    spineRecommendation.suggestedSpine,
    spineRecommendation.rangeMin,
    spineRecommendation.rangeMax
  );
  const frontMassGrains = finiteOr(params.pointWeightGrains, 100) + finiteOr(params.insertWeightGrains, 0);
  const totalMassGrains = resolveTotalMassGrains(params, frontMassGrains);
  const focPercent = Number.isFinite(params.focPercent)
    ? params.focPercent
    : estimateFocPercent(params, frontMassGrains);
  const massInertiaFactor = normalizeAround(totalMassGrains, 386, 260);
  const frontMassFactor = normalizeAround(frontMassGrains, 112, 120);
  const focFactor = normalizeAround(focPercent, 11, 12);
  const arrowLengthFactor = normalizeAround(finiteOr(params.arrowLengthIn, 29), 29, 6);
  const effectiveDrawWeightFactor = normalizeAround(finiteOr(effectiveDrawWeight, params.drawWeightLbs), 35, 40);
  const staticSpineFactor = normalizeAround(finiteOr(params.spineStatic, 600), 600, 700);

  // Proxy volontairement borné : plus la valeur monte, plus le système paraît "souple dynamiquement".
  const stiffnessProxy = clamp(
    0.45 +
    staticSpineFactor * 0.38 +
    frontMassFactor * 0.24 +
    arrowLengthFactor * 0.22 +
    effectiveDrawWeightFactor * 0.18 -
    massInertiaFactor * 0.08,
    0,
    1
  );

  const spineMismatchSeverity = spineMismatch.severity;
  const verticalExitRisk = clamp(
    Math.abs(finiteOr(params.nockingPointOffsetMm, 0)) / 8 +
    Math.abs(finiteOr(params.releaseErrorVerticalMm, 0)) / 14 +
    spineMismatchSeverity * 0.18 +
    frontMassFactor * 0.12 +
    focFactor * 0.12 +
    arrowLengthFactor * 0.08 +
    effectiveDrawWeightFactor * 0.08 -
    massInertiaFactor * 0.08,
    0,
    1
  );
  const lateralExitRisk = clamp(
    Math.abs(finiteOr(params.centerShotMm, 0)) / 8 +
    Math.abs(finiteOr(params.releaseErrorLateralMm, 0)) / 14 +
    (1 - finiteOr(params.plungerStiffness, 0.5)) * 0.35 +
    spineMismatchSeverity * 0.42 +
    frontMassFactor * 0.12 +
    arrowLengthFactor * 0.12 +
    effectiveDrawWeightFactor * 0.08 -
    massInertiaFactor * 0.1,
    0,
    1
  );

  return {
    spineMismatchSeverity,
    massInertiaFactor,
    frontMassFactor,
    focFactor,
    arrowLengthFactor,
    effectiveDrawWeightFactor,
    stiffnessProxy,
    verticalExitRisk,
    lateralExitRisk
  };
}

export function calculateTuningModel(params, arrow) {
  const releaseType = deriveInternalReleaseType(params.bowType);
  const releaseScale = releaseType === 'fingers' ? 1.12 : 0.82;
  const spinDamping = clamp(arrow.spinStabilization / 2.2, 0.25, 1.4);
  const spineMismatch = resolveSpineMismatch(params);
  const dynamicInputs = computeDynamicTuningInputs(
    {
      ...params,
      focPercent: arrow.focPercent,
      totalMassGrains: arrow.totalMassGrains
    },
    params.spineRecommendation || {}
  );

  const fishtailingNotes = buildFishtailingNotes(spineMismatch, dynamicInputs);
  const porpoisingNotes = buildPorpoisingNotes(spineMismatch, dynamicInputs);

  const verticalAmplitudeCm = clamp(
    0.35 +
    Math.abs(finiteOr(params.nockingPointOffsetMm, 0)) * 0.24 +
    Math.abs(finiteOr(params.releaseErrorVerticalMm, 0)) * 0.18 +
    dynamicInputs.verticalExitRisk * 1.25 +
    dynamicInputs.frontMassFactor * 0.38 +
    dynamicInputs.focFactor * 0.24 +
    dynamicInputs.arrowLengthFactor * 0.2 +
    dynamicInputs.effectiveDrawWeightFactor * 0.18 +
    dynamicInputs.spineMismatchSeverity * 0.3 -
    dynamicInputs.massInertiaFactor * 0.22,
    0.2,
    5.2
  );

  const lateralAmplitudeCm = clamp(
    0.35 +
    Math.abs(finiteOr(params.centerShotMm, 0)) * 0.22 +
    Math.abs(finiteOr(params.releaseErrorLateralMm, 0)) * 0.22 +
    (1 - finiteOr(params.plungerStiffness, 0.5)) * 1.15 * releaseScale +
    dynamicInputs.lateralExitRisk * 1.35 +
    dynamicInputs.spineMismatchSeverity * 1.35 +
    dynamicInputs.frontMassFactor * mismatchDirectionalBoost(spineMismatch.status, 'soft') +
    dynamicInputs.arrowLengthFactor * 0.28 +
    dynamicInputs.effectiveDrawWeightFactor * 0.24 -
    dynamicInputs.massInertiaFactor * 0.18,
    0.2,
    6
  );

  const verticalFrequencyHz = 12.2 +
    finiteOr(dynamicInputs.effectiveDrawWeightFactor, 0) * 3.2 -
    finiteOr(dynamicInputs.frontMassFactor, 0) * 1.4 -
    finiteOr(dynamicInputs.arrowLengthFactor, 0) * 0.8 -
    finiteOr(dynamicInputs.massInertiaFactor, 0) * 0.9;
  const lateralFrequencyHz = 10.8 +
    finiteOr(dynamicInputs.stiffnessProxy, 0) * 2.4 -
    finiteOr(dynamicInputs.arrowLengthFactor, 0) * 1.1 -
    finiteOr(dynamicInputs.massInertiaFactor, 0) * 0.7;
  const verticalDamping = clamp(1.8 + spinDamping * 0.8 + arrow.vaneDragFactor * 0.35, 1.3, 4.5);
  const lateralDamping = clamp(1.5 + spinDamping * 1.1 + arrow.vaneDragFactor * 0.45, 1.2, 5);

  const porpoising = {
    amplitudeCm: verticalAmplitudeCm,
    level: buildAmplitudeLevel(verticalAmplitudeCm, 1.2, 2.5),
    notes: porpoisingNotes
  };
  const fishtailing = {
    amplitudeCm: lateralAmplitudeCm,
    level: buildAmplitudeLevel(lateralAmplitudeCm, 1.4, 3),
    notes: fishtailingNotes
  };

  return {
    porpoising,
    fishtailing,
    spineMismatch: {
      ...spineMismatch,
      notes: [spineMismatchMessage(spineMismatch.status)]
    },
    diagnostics: buildDiagnostics(params, porpoising, fishtailing, spineMismatch),
    dynamicInputs,
    verticalAmplitudeCm,
    lateralAmplitudeCm,
    verticalFrequencyHz,
    lateralFrequencyHz,
    verticalDamping,
    lateralDamping,
    spinDamping
  };
}

export function oscillationAt(time, model) {
  const vertical = model.porpoising.amplitudeCm *
    Math.exp(-model.verticalDamping * time) *
    Math.sin(2 * Math.PI * model.verticalFrequencyHz * time);
  const lateral = model.fishtailing.amplitudeCm *
    Math.exp(-model.lateralDamping * time) *
    Math.sin(2 * Math.PI * model.lateralFrequencyHz * time + Math.PI / 5);
  return { verticalCm: vertical, lateralCm: lateral };
}

function resolveSpineMismatch(params = {}) {
  const recommendation = params.spineRecommendation || {};
  return computeSpineMismatch(
    params.spineStatic,
    recommendation.suggestedSpine,
    recommendation.rangeMin,
    recommendation.rangeMax
  );
}

function buildDiagnostics(params, porpoising, fishtailing, spineMismatch) {
  const spineDetail = spineMismatchMessage(spineMismatch.status);
  const fishtailingDetail = spineMismatch.status === 'unknown'
    ? 'Indicateur comparatif piloté par le centrage latéral, le berger button et la sortie latérale.'
    : `Indicateur comparatif piloté par le centrage latéral, le berger button, la sortie latérale et le spine. ${spineDetail}`;

  return [
    {
      label: 'Oscillation verticale',
      level: porpoising.level,
      detail: porpoising.notes.join(' ')
    },
    {
      label: 'Oscillation latérale',
      level: fishtailing.level,
      detail: fishtailingDetail
    },
    {
      label: 'Dérive au vent',
      level: params.windSpeedKmh > 18 ? 'élevé' : params.windSpeedKmh > 8 ? 'modéré' : 'faible',
      detail: 'Dépend du temps de vol, du vent latéral et de la surface exposée.'
    },
    {
      label: 'Spine',
      level: buildSpineLevel(spineMismatch.status),
      detail: spineDetail
    }
  ];
}

function buildFishtailingNotes(spineMismatch, dynamicInputs) {
  const notes = [];
  if (spineMismatch.status === 'too-soft') {
    notes.push('Spine plus souple que la fourchette : la sortie latérale devient plus sensible.');
  } else if (spineMismatch.status === 'too-stiff') {
    notes.push('Spine plus raide que la fourchette : le dégagement latéral devient moins tolérant.');
  }
  if (dynamicInputs.frontMassFactor > 0.1) {
    notes.push('La masse avant adoucit dynamiquement la flèche.');
  }
  if (Math.abs(dynamicInputs.massInertiaFactor) > 0.1) {
    notes.push('La masse totale modifie l?inertie vibratoire du syst?me.');
  }
  if (dynamicInputs.arrowLengthFactor > 0.05) {
    notes.push('Une flèche plus longue augmente la souplesse dynamique.');
  }
  return notes;
}

function buildPorpoisingNotes(spineMismatch, dynamicInputs) {
  const notes = ['Proxy borné : la réponse verticale dépend surtout de la sortie et de la répartition des masses.'];
  if (dynamicInputs.frontMassFactor > 0.1 || dynamicInputs.focFactor > 0.1) {
    notes.push('La masse avant et le FOC modifient la réponse verticale.');
  }
  if (Math.abs(dynamicInputs.massInertiaFactor) > 0.1) {
    notes.push('La masse totale agit comme un amortisseur inertiel born? dans ce proxy.');
  }
  if (spineMismatch.severity > 0.35) {
    notes.push('Un mismatch spine marqué ajoute un risque vertical secondaire.');
  }
  return notes;
}

function buildAmplitudeLevel(value, moderateThreshold, highThreshold) {
  return value > highThreshold ? 'élevé' : value > moderateThreshold ? 'modéré' : 'faible';
}

function buildSpineLevel(status) {
  if (status === 'too-stiff') return 'plus raide';
  if (status === 'too-soft') return 'plus souple';
  if (status === 'in-range') return 'dans la fourchette';
  return 'donnée non disponible';
}

function mismatchDirectionalBoost(status, direction) {
  if (status === 'too-soft' && direction === 'soft') return 0.42;
  if (status === 'too-stiff' && direction === 'soft') return 0.18;
  return 0.24;
}

function estimateFocPercent(params, frontMassGrains) {
  if (Number.isFinite(params.balancePointIn) && params.balancePointIn > 0 && Number.isFinite(params.arrowLengthIn)) {
    return ((params.balancePointIn - params.arrowLengthIn / 2) / params.arrowLengthIn) * 100;
  }
  const totalMassGrains = resolveTotalMassGrains(params, frontMassGrains);
  return clamp((frontMassGrains / Math.max(totalMassGrains, 1)) * 38, 4, 24);
}

function resolveTotalMassGrains(params, frontMassGrains) {
  if (Number.isFinite(params.totalMassGrains)) return params.totalMassGrains;
  if (Number.isFinite(params.totalMassGr)) return params.totalMassGr * 15.4323584;
  if (Number.isFinite(params.poidsGr)) return params.poidsGr * 15.4323584;
  return frontMassGrains + 180;
}

function normalizeAround(value, baseline, span) {
  return clamp((finiteOr(value, baseline) - baseline) / span, -1, 1);
}

function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

export const TUNING_DOC =
  'Oscillations verticale et latérale restent des diagnostics comparatifs séparés de la trajectoire.';

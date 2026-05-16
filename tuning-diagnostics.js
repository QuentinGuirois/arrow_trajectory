// tuning-diagnostics.js
// Diagnostics de réglage séparés de la trajectoire du centre de masse.
// L'étude locale rappelle qu'un spine statique seul ne résume pas la dynamique :
// fréquence propre, amortissement, raideur et masse comptent aussi.
// Le module fournit donc une estimation utile, mais garde visibles ses hypothèses.

import { buildArrow } from './arrow-builder.js';
import { deriveInternalReleaseType } from './bow-utils.js';
import { resolveEffectiveDrawWeight } from './draw-weight.js';
import { computeSpineMismatch, spineMismatchMessage } from './spine-evaluation.js';
import { resolveSpineRecommendation } from './spine-recommendation.js';
import { clamp } from './units.js';

export const OSCILLATOR_FORMULA =
  'osc(x) = A0 * exp(-x/lambda) * sin(2πx/wavelength + phase)';

const EXPERIMENTAL_OSCILLATOR_DEFAULTS = {
  porpoising: {
    lambdaM: 22,
    wavelengthM: 7.5,
    phaseRad: 0
  },
  fishtailing: {
    lambdaM: 18,
    wavelengthM: 6.5,
    phaseRad: Math.PI / 5
  }
};

export function computeTuningDiagnostics(params = {}, trajectory = []) {
  const arrow = buildArrow(params);
  const spineRecommendation = resolveRecommendation(params);
  const model = calculateTuningModel({ ...params, spineRecommendation }, arrow);
  const points = normalizeTrajectory(trajectory);
  const missingData = collectMissingData(params, arrow, spineRecommendation);
  const aoa = summarizeAoa(model, points);

  return {
    confidence: buildConfidence(missingData, points),
    porpoising: toPublicOscillation(model.porpoising),
    fishtailing: toPublicOscillation(model.fishtailing),
    aoa,
    recommendations: buildRecommendations({
      missingData,
      model,
      arrow,
      aoa
    })
  };
}

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
  const focPercent = Number.isFinite(params.focPercent) ? params.focPercent : null;
  const massInertiaFactor = normalizeAround(totalMassGrains, 386, 260);
  const frontMassFactor = normalizeAround(frontMassGrains, 112, 120);
  const focFactor = Number.isFinite(focPercent) ? normalizeAround(focPercent, 11, 12) : 0;
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

// API de compatibilité interne : le worker l'utilise pour dessiner l'enveloppe,
// mais jamais pour modifier la trajectoire COM.
export function calculateTuningModel(params = {}, arrow = buildArrow(params)) {
  const releaseType = deriveInternalReleaseType(params.bowType);
  const releaseScale = releaseType === 'fingers' ? 1.12 : 0.82;
  const spineMismatch = resolveSpineMismatch(params);
  const dynamicInputs = computeDynamicTuningInputs(
    {
      ...params,
      focPercent: arrow.focPercent,
      totalMassGrains: arrow.totalMassGrains
    },
    params.spineRecommendation || {}
  );

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

  const porpoising = {
    amplitudeCm: verticalAmplitudeCm,
    level: buildAmplitudeLevel(verticalAmplitudeCm, 1.2, 2.5),
    notes: buildPorpoisingNotes(spineMismatch, dynamicInputs),
    oscillator: resolveOscillator('porpoising', verticalAmplitudeCm, params)
  };
  const fishtailing = {
    amplitudeCm: lateralAmplitudeCm,
    level: buildAmplitudeLevel(lateralAmplitudeCm, 1.4, 3),
    notes: buildFishtailingNotes(spineMismatch, dynamicInputs),
    oscillator: resolveOscillator('fishtailing', lateralAmplitudeCm, params)
  };

  return {
    porpoising,
    fishtailing,
    spineMismatch: {
      ...spineMismatch,
      notes: [spineMismatchMessage(spineMismatch.status)]
    },
    diagnostics: buildLegacyDiagnostics(params, porpoising, fishtailing, spineMismatch),
    dynamicInputs,
    verticalAmplitudeCm,
    lateralAmplitudeCm
  };
}

export function oscillationAtDistance(distanceM, model) {
  const x = Math.max(0, finiteOr(distanceM, 0));
  const vertical = evaluateOscillator(x, model.porpoising.oscillator);
  const lateral = evaluateOscillator(x, model.fishtailing.oscillator);
  return {
    verticalCm: vertical.valueCm,
    lateralCm: lateral.valueCm,
    verticalSlopeCmPerM: vertical.slopeCmPerM,
    lateralSlopeCmPerM: lateral.slopeCmPerM
  };
}

export const oscillationAt = oscillationAtDistance;

function resolveRecommendation(params) {
  return params.spineRecommendation || resolveSpineRecommendation(params);
}

function resolveOscillator(kind, estimatedAmplitudeCm, params) {
  const defaults = EXPERIMENTAL_OSCILLATOR_DEFAULTS[kind];
  const user = params.tuningOscillator?.[kind] || {};
  return {
    formula: OSCILLATOR_FORMULA,
    A0Cm: finitePositiveOr(user.A0Cm, estimatedAmplitudeCm),
    lambdaM: finitePositiveOr(user.lambdaM, defaults.lambdaM),
    wavelengthM: finitePositiveOr(user.wavelengthM, defaults.wavelengthM),
    phaseRad: finiteOr(user.phaseRad, defaults.phaseRad),
    parameterSources: {
      A0: Number.isFinite(user.A0Cm) ? 'réglable' : 'proxy estimé',
      lambda: Number.isFinite(user.lambdaM) ? 'réglable' : 'défaut expérimental',
      wavelength: Number.isFinite(user.wavelengthM) ? 'réglable' : 'défaut expérimental',
      phase: Number.isFinite(user.phaseRad) ? 'réglable' : 'défaut expérimental'
    }
  };
}

function evaluateOscillator(x, oscillator) {
  const decay = Math.exp(-x / oscillator.lambdaM);
  const angle = (2 * Math.PI * x / oscillator.wavelengthM) + oscillator.phaseRad;
  const valueCm = oscillator.A0Cm * decay * Math.sin(angle);
  const slopeCmPerM = oscillator.A0Cm * decay * (
    (2 * Math.PI / oscillator.wavelengthM) * Math.cos(angle) -
    (1 / oscillator.lambdaM) * Math.sin(angle)
  );
  return { valueCm, slopeCmPerM };
}

function toPublicOscillation(channel) {
  return {
    status: 'estimé',
    level: channel.level,
    amplitudeCm: channel.amplitudeCm,
    oscillator: channel.oscillator,
    notes: [
      ...channel.notes,
      'A0 est un proxy estimé ; lambda et wavelength restent expérimentaux ou réglables.'
    ]
  };
}

function normalizeTrajectory(trajectory) {
  if (Array.isArray(trajectory)) return trajectory.filter(point => Number.isFinite(point?.x));
  if (Array.isArray(trajectory?.positions)) return trajectory.positions.filter(point => Number.isFinite(point?.x));
  return [];
}

function summarizeAoa(model, points) {
  const distances = sampleDiagnosticDistances(points);
  const angles = distances.map(distance => estimateAoaDegAtDistance(distance, model));
  const maxEstimatedDeg = angles.length ? Math.max(...angles) : 0;
  return {
    status: points.length ? 'estimé' : 'qualitatif seulement',
    level: buildAoaLevel(maxEstimatedDeg),
    maxEstimatedDeg,
    basis: points.length
      ? 'Dérivé de la pente de l’oscillateur diagnostic sur la trajectoire COM.'
      : 'Dérivé d’une plage de distance par défaut faute de trajectoire fournie.',
    note: 'Proxy d’angle d’attaque lié au diagnostic tuning ; il ne pilote pas le modèle aérodynamique COM.'
  };
}

function estimateAoaDegAtDistance(distanceM, model) {
  const tune = oscillationAtDistance(distanceM, model);
  const slopeMPerM = Math.hypot(tune.verticalSlopeCmPerM, tune.lateralSlopeCmPerM) / 100;
  return Math.atan(slopeMPerM) * 180 / Math.PI;
}

function sampleDiagnosticDistances(points) {
  if (!points.length) {
    return Array.from({ length: 15 }, (_, i) => i * 5);
  }
  const maxDistance = Math.max(...points.map(point => point.x));
  const stepCount = Math.min(80, Math.max(12, Math.ceil(maxDistance / 2)));
  return Array.from({ length: stepCount + 1 }, (_, i) => (maxDistance * i) / stepCount);
}

function collectMissingData(params, arrow, spineRecommendation) {
  const missing = [];
  if (!Number.isFinite(params.spineStatic)) {
    missing.push({
      key: 'spineStatic',
      label: 'spine statique saisi',
      defaultUsed: '600',
      why: 'fiabiliser le risque de fishtailing'
    });
  }
  if (spineRecommendation.status !== 'available') {
    missing.push({
      key: 'spineRecommendation',
      label: 'plage de spine vérifiée pour ce setup',
      defaultUsed: 'comparaison spine ignorée',
      why: 'ancrer le diagnostic latéral'
    });
  }
  if (!(Number.isFinite(params.balancePointIn) && params.balancePointIn > 0)) {
    missing.push({
      key: 'balancePointIn',
      label: 'point d’équilibre mesuré / FOC',
      defaultUsed: Number.isFinite(arrow.focPercent) ? `FOC ${arrow.focSource}` : 'FOC neutre',
      why: 'fiabiliser la stabilité qualitative'
    });
  }
  if (params.massMode === 'components' && !Number.isFinite(params.vaneWeightTotalGrains)) {
    missing.push({
      key: 'vaneWeightTotalGrains',
      label: 'poids total d’empennage',
      defaultUsed: 'non intégré au FOC par composants',
      why: 'fiabiliser le FOC estimé'
    });
  }
  addMissingNumeric(missing, params, 'nockingPointOffsetMm', 'décalage du point d’encochage', '0 mm', 'fiabiliser le porpoising');
  addMissingNumeric(missing, params, 'centerShotMm', 'centrage latéral', '0 mm', 'fiabiliser le fishtailing');
  addMissingNumeric(missing, params, 'plungerStiffness', 'raideur du berger button', '0,5', 'fiabiliser le fishtailing');
  addMissingNumeric(missing, params, 'releaseErrorVerticalMm', 'erreur de décoche verticale', '0 mm', 'fiabiliser le porpoising');
  addMissingNumeric(missing, params, 'releaseErrorLateralMm', 'erreur de décoche latérale', '0 mm', 'fiabiliser le fishtailing');
  return missing;
}

function addMissingNumeric(target, params, key, label, defaultUsed, why) {
  if (!Number.isFinite(params[key])) {
    target.push({ key, label, defaultUsed, why });
  }
}

function buildConfidence(missingData, points) {
  const level = missingData.length >= 3 ? 'faible' : 'modérée';
  return {
    level,
    mode: missingData.length ? 'estimation avec valeurs par défaut' : 'estimation renseignée',
    trajectoryBasis: points.length ? 'trajectoire fournie' : 'distance de référence par défaut',
    missingData,
    disclaimer: 'Diagnostic qualitatif, pas simulation flexible complète.'
  };
}

function buildRecommendations({ missingData, model, arrow, aoa }) {
  const recommendations = missingData.map(item =>
    `Renseigner ${item.label} pour ${item.why} ; valeur utilisée actuellement : ${item.defaultUsed}.`
  );
  if (model.spineMismatch.status === 'too-soft') {
    recommendations.push('Spine plus souple que la fourchette : vérifier spine, longueur ou masse avant au tuning réel.');
  }
  if (model.spineMismatch.status === 'too-stiff') {
    recommendations.push('Spine plus raide que la fourchette : vérifier dégagement latéral et compatibilité du setup.');
  }
  if (arrow.stabilityLabel !== 'donnée non disponible') {
    recommendations.push(`Stabilité qualitative : ${arrow.stabilityLabel}.`);
  }
  if (aoa.level === 'élevé') {
    recommendations.push('AoA diagnostic élevé : confirmer au tir réel avant de conclure sur la stabilité.');
  }
  if (!recommendations.length) {
    recommendations.push('Estimation exploitable ; la validation au pas de tir reste la référence.');
  }
  return recommendations;
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

function buildLegacyDiagnostics(params, porpoising, fishtailing, spineMismatch) {
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
    notes.push('La masse totale modifie l’inertie vibratoire du système.');
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
    notes.push('La masse totale agit comme un amortisseur inertiel borné dans ce proxy.');
  }
  if (spineMismatch.severity > 0.35) {
    notes.push('Un mismatch spine marqué ajoute un risque vertical secondaire.');
  }
  return notes;
}

function buildAmplitudeLevel(value, moderateThreshold, highThreshold) {
  return value > highThreshold ? 'élevé' : value > moderateThreshold ? 'modéré' : 'faible';
}

function buildAoaLevel(valueDeg) {
  return valueDeg > 3 ? 'élevé' : valueDeg > 1 ? 'modéré' : 'faible';
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

function resolveTotalMassGrains(params, frontMassGrains) {
  if (Number.isFinite(params.totalMassGrains)) return params.totalMassGrains;
  if (Number.isFinite(params.totalMassGr)) return params.totalMassGr * 15.4323584;
  if (Number.isFinite(params.poidsGr)) return params.poidsGr * 15.4323584;
  return frontMassGrains + 180;
}

function normalizeAround(value, baseline, span) {
  return clamp((finiteOr(value, baseline) - baseline) / span, -1, 1);
}

function finitePositiveOr(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

export const TUNING_DOC =
  'Oscillations verticale et latérale restent des diagnostics comparatifs séparés de la trajectoire COM.';

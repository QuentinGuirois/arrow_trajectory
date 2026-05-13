// arrow-builder.js
// Calcule les propriétés dérivées du setup de flèche et signale les incohérences.

import { gramsToGrains, grainsToGrams, inchesToMeters, clamp } from './units.js';

const VANE_GRAINS_PER_INCH = { low: 0.7, medium: 1.1, high: 1.7 };
const PROFILE_STABILITY = { low: 0.88, medium: 1, high: 1.14 };

export function buildArrow(params) {
  const arrowLengthIn = params.arrowLengthIn;
  const shaftMassGrains = Math.max(0, params.shaftGpi * arrowLengthIn);
  const vaneMassGrains = params.vaneCount * params.vaneLengthIn * (VANE_GRAINS_PER_INCH[params.vaneProfile] || 1.1);
  const componentMassGrains = shaftMassGrains + params.pointWeightGrains + params.insertWeightGrains + params.nockWeightGrains + vaneMassGrains;
  const totalMassGr = params.massMode === 'gpi' ? grainsToGrams(componentMassGrains) : params.poidsGr;
  const totalMassGrains = gramsToGrains(totalMassGr);

  const lengthM = inchesToMeters(arrowLengthIn);
  const diameterM = params.diameter;
  const frontalAreaM2 = Math.PI * Math.pow(diameterM / 2, 2);
  const focPercent = resolveFoc(params, shaftMassGrains, vaneMassGrains, componentMassGrains);
  const dynamicSpineFactor = calculateDynamicSpineFactor(params);
  const stabilityScore = calculateStabilityScore(params, focPercent, dynamicSpineFactor, totalMassGrains);
  const warnings = buildWarnings(params, totalMassGr, focPercent, dynamicSpineFactor);

  return {
    totalMassGr,
    totalMassKg: totalMassGr / 1000,
    totalMassGrains,
    shaftMassGrains,
    vaneMassGrains,
    lengthM,
    diameterM,
    frontalAreaM2,
    focPercent,
    dynamicSpineFactor,
    stabilityScore,
    warnings,
    vaneDragFactor: calculateVaneDragFactor(params),
    spinStabilization: calculateSpinStabilization(params)
  };
}

function resolveFoc(params, shaftMassGrains, vaneMassGrains, componentMassGrains) {
  if (params.balancePointIn > 0) {
    return ((params.balancePointIn - params.arrowLengthIn / 2) / params.arrowLengthIn) * 100;
  }
  if (params.focPercent > 0) return params.focPercent;

  const moments =
    shaftMassGrains * (params.arrowLengthIn / 2) +
    params.pointWeightGrains * params.arrowLengthIn +
    params.insertWeightGrains * Math.max(0, params.arrowLengthIn - 0.6) +
    params.nockWeightGrains * 0.25 +
    vaneMassGrains * 3.5;
  const balancePoint = moments / Math.max(1, componentMassGrains);
  return ((balancePoint - params.arrowLengthIn / 2) / params.arrowLengthIn) * 100;
}

export function calculateDynamicSpineFactor(params) {
  const drawFactor = params.drawWeightLbs / 40;
  const lengthFactor = Math.pow(params.arrowLengthIn / 28, 1.7);
  const pointFactor = (params.pointWeightGrains + params.insertWeightGrains * 0.45) / 110;
  const spineFactor = 500 / Math.max(250, params.spineStatic);
  const releaseFactor = params.releaseType === 'fingers' ? 1.08 : 0.94;
  const camFactor = params.bowType.startsWith('compound') ? 1 + params.camAggressiveness * 0.1 : 1;
  return drawFactor * lengthFactor * pointFactor * spineFactor * releaseFactor * camFactor;
}

function calculateVaneDragFactor(params) {
  const profile = PROFILE_STABILITY[params.vaneProfile] || 1;
  const orientation = params.fletchingOrientation === 'helical' ? 1.22 : params.fletchingOrientation === 'offset' ? 1.1 : 1;
  return profile * orientation * (params.vaneCount / 3) * (params.vaneLengthIn / 2);
}

function calculateSpinStabilization(params) {
  const orientation = params.fletchingOrientation === 'helical' ? 1.35 : params.fletchingOrientation === 'offset' ? 1.15 : 0.9;
  const angle = 1 + clamp(params.fletchingAngleDeg, 0, 5) * 0.08;
  return orientation * angle * calculateVaneDragFactor(params);
}

function calculateStabilityScore(params, focPercent, dynamicSpineFactor, totalMassGrains) {
  let score = 82;
  score -= Math.abs(dynamicSpineFactor - 1) * 34;
  if (focPercent < 7) score -= (7 - focPercent) * 3.5;
  if (focPercent > 16) score -= (focPercent - 16) * 2.2;
  if (totalMassGrains < params.drawWeightLbs * 5) score -= 12;
  score += Math.min(10, calculateSpinStabilization(params) * 4);
  return Math.round(clamp(score, 0, 100));
}

function buildWarnings(params, totalMassGr, focPercent, dynamicSpineFactor) {
  const warnings = [];
  if (params.massMode === 'gpi' && params.shaftGpi <= 0) warnings.push('GPI manquant: masse calculée peu fiable.');
  if (totalMassGr < 18) warnings.push('Flèche très légère: vérifier les limites constructeur de l’arc.');
  if (focPercent < 7) warnings.push('FOC bas: stabilité de pointe et dérive potentiellement moins bonnes.');
  if (focPercent > 18) warnings.push('FOC élevé: trajectoire plus plongeante et spine dynamique affaibli.');
  if (dynamicSpineFactor > 1.18) warnings.push('Spine dynamique probablement faible pour ce setup.');
  if (dynamicSpineFactor < 0.82) warnings.push('Spine dynamique probablement raide pour ce setup.');
  if (params.releaseType === 'fingers' && params.bowType.startsWith('compound')) warnings.push('Décoche aux doigts sur compound: modèle expérimental.');
  return warnings;
}

export const ARROW_BUILDER_DOC = 'Calcule masse, FOC, surface frontale, spine dynamique proxy, stabilité et avertissements.';

// arrow-builder.js
// Calcule masse, FOC, surface frontale et propriétés aérodynamiques simples.
// Ne recommande pas de spine sans table fabricant vérifiée.

import { gramsToGrains, grainsToGrams, inchesToMeters, clamp } from './units.js';
import { lookupRecommendedSpine } from './spine-lookup.js';

const VANE_GRAINS_PER_INCH = { low: 0.7, medium: 1.1, high: 1.7 };
const PROFILE_FACTOR = { low: 0.88, medium: 1, high: 1.14 };

export function buildArrow(params) {
  const arrowLengthIn = params.arrowLengthIn;
  const shaftMassGrains = Math.max(0, params.shaftGpi * arrowLengthIn);
  const vaneMassGrains = params.vaneCount * params.vaneLengthIn * (VANE_GRAINS_PER_INCH[params.vaneProfile] || 1.1);
  const componentMassGrains = shaftMassGrains + params.pointWeightGrains + params.insertWeightGrains + params.nockWeightGrains + vaneMassGrains;
  const totalMassGr = params.massMode === 'components' ? grainsToGrams(componentMassGrains) : params.poidsGr;
  const totalMassGrains = gramsToGrains(totalMassGr);
  const focPercent = resolveFoc(params, shaftMassGrains, vaneMassGrains, componentMassGrains);
  const spineLookup = lookupRecommendedSpine(params);

  return {
    totalMassGr,
    totalMassKg: totalMassGr / 1000,
    totalMassGrains,
    shaftMassGrains,
    vaneMassGrains,
    lengthM: inchesToMeters(arrowLengthIn),
    diameterM: params.diameter,
    frontalAreaM2: Math.PI * Math.pow(params.diameter / 2, 2),
    focPercent,
    spineStatic: params.spineStatic,
    spineLookup,
    qualitativeTrends: spineLookup.qualitativeTrends,
    stabilityLabel: calculateAeroStabilityLabel(params, focPercent),
    warnings: buildWarnings(params, totalMassGr, focPercent, spineLookup),
    vaneDragFactor: calculateVaneDragFactor(params),
    spinStabilization: calculateSpinStabilization(params)
  };
}

function resolveFoc(params, shaftMassGrains, vaneMassGrains, componentMassGrains) {
  if (params.balancePointIn > 0) {
    return ((params.balancePointIn - params.arrowLengthIn / 2) / params.arrowLengthIn) * 100;
  }
  const moments =
    shaftMassGrains * (params.arrowLengthIn / 2) +
    params.pointWeightGrains * params.arrowLengthIn +
    params.insertWeightGrains * Math.max(0, params.arrowLengthIn - 0.6) +
    params.nockWeightGrains * 0.25 +
    vaneMassGrains * 3.5;
  const balancePoint = moments / Math.max(1, componentMassGrains);
  return ((balancePoint - params.arrowLengthIn / 2) / params.arrowLengthIn) * 100;
}

function calculateVaneDragFactor(params) {
  const profile = PROFILE_FACTOR[params.vaneProfile] || 1;
  const orientation = params.fletchingOrientation === 'helical' ? 1.22 : params.fletchingOrientation === 'offset' ? 1.1 : 1;
  return profile * orientation * (params.vaneCount / 3) * (params.vaneLengthIn / 2);
}

function calculateSpinStabilization(params) {
  const orientation = params.fletchingOrientation === 'helical' ? 1.35 : params.fletchingOrientation === 'offset' ? 1.15 : 0.9;
  const angle = 1 + clamp(params.fletchingAngleDeg, 0, 5) * 0.08;
  return orientation * angle * calculateVaneDragFactor(params);
}

function calculateAeroStabilityLabel(params, focPercent) {
  if (!Number.isFinite(focPercent)) return 'donnée non disponible';
  if (focPercent < 7) return 'FOC bas: vérifier au tir';
  if (focPercent > 18) return 'FOC élevé: vérifier trajectoire et groupement';
  if (params.vaneProfile === 'high' || params.fletchingOrientation === 'helical') return 'stabilisation empennage élevée';
  return 'stabilisation empennage standard';
}

function buildWarnings(params, totalMassGr, focPercent, spineLookup) {
  const warnings = [];
  if (params.massMode === 'components' && params.shaftGpi <= 0) warnings.push('GPI manquant: masse par composants indisponible.');
  if (totalMassGr <= 0) warnings.push('Masse totale invalide.');
  if (Number.isFinite(focPercent) && focPercent < 7) warnings.push('FOC bas: tendance possible à une stabilité de pointe plus faible.');
  if (Number.isFinite(focPercent) && focPercent > 18) warnings.push('FOC élevé: trajectoire et réglage à valider au pas de tir.');
  if (spineLookup.confidence === 'no-data') warnings.push(...spineLookup.notes);
  return warnings;
}

export const ARROW_BUILDER_DOC = 'Calcule les données de flèche sans inventer de recommandation spine.';

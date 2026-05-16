// arrow-builder.js
// Calcule masse, FOC, surface frontale et propriétés aérodynamiques simples.
// Ne recommande pas de spine sans table fabricant vérifiée.

import { gramsToGrains, grainsToGrams, inchesToMeters, clamp } from './units.js';
import { getSpineQualitativeTrends } from './spine-trends.js';

const PROFILE_FACTOR = { low: 0.88, medium: 1, high: 1.14 };

export function buildArrow(params) {
  const arrowLengthIn = params.arrowLengthIn;
  const shaftMassGrains = positiveMass(params.shaftGpi) * positiveMass(arrowLengthIn);
  const vaneMassGrains = explicitMassOrNull(params.vaneWeightTotalGrains);
  const pointMassGrains = positiveMass(params.pointWeightGrains);
  const insertMassGrains = positiveMass(params.insertWeightGrains);
  const nockMassGrains = positiveMass(params.nockWeightGrains);
  const componentMassGrains =
    shaftMassGrains +
    pointMassGrains +
    insertMassGrains +
    nockMassGrains +
    (vaneMassGrains ?? 0);
  const totalMassGr = params.massMode === 'components' ? grainsToGrams(componentMassGrains) : params.poidsGr;
  const totalMassGrains = gramsToGrains(totalMassGr);
  const foc = resolveFoc(params, {
    shaftMassGrains,
    pointMassGrains,
    insertMassGrains,
    nockMassGrains,
    vaneMassGrains,
    componentMassGrains
  });

  return {
    totalMassGr,
    totalMassKg: totalMassGr / 1000,
    totalMassGrains,
    shaftMassGrains,
    componentMassGrains,
    componentMassComplete: vaneMassGrains !== null,
    vaneMassGrains,
    pointWeightTotalGrains: pointMassGrains + insertMassGrains,
    lengthM: inchesToMeters(arrowLengthIn),
    diameterM: params.diameter,
    frontalAreaM2: Math.PI * Math.pow(params.diameter / 2, 2),
    focPercent: foc.percent,
    focSource: foc.source,
    spineStatic: params.spineStatic,
    qualitativeTrends: getSpineQualitativeTrends(params),
    stabilityLabel: calculateAeroStabilityLabel(params, foc.percent),
    warnings: buildWarnings(params, totalMassGr, foc.percent, vaneMassGrains),
    vaneDragFactor: calculateVaneDragFactor(params),
    spinStabilization: calculateSpinStabilization(params)
  };
}

function resolveFoc(params, masses) {
  if (params.balancePointIn > 0 && params.arrowLengthIn > 0) {
    return {
      percent: ((params.balancePointIn - params.arrowLengthIn / 2) / params.arrowLengthIn) * 100,
      source: 'measured'
    };
  }
  if (!hasCompleteFocInputs(params, masses)) {
    return {
      percent: null,
      source: 'unavailable'
    };
  }
  const moments =
    masses.shaftMassGrains * (params.arrowLengthIn / 2) +
    masses.pointMassGrains * params.arrowLengthIn +
    masses.insertMassGrains * Math.max(0, params.arrowLengthIn - 0.6) +
    masses.nockMassGrains * 0.25 +
    masses.vaneMassGrains * 3.5;
  const balancePoint = moments / Math.max(1, masses.componentMassGrains);
  return {
    percent: ((balancePoint - params.arrowLengthIn / 2) / params.arrowLengthIn) * 100,
    source: 'estimated'
  };
}

function hasCompleteFocInputs(params, masses) {
  return (
    Number.isFinite(params.arrowLengthIn) &&
    params.arrowLengthIn > 0 &&
    Number.isFinite(params.shaftGpi) &&
    params.shaftGpi >= 0 &&
    Number.isFinite(params.pointWeightGrains) &&
    params.pointWeightGrains >= 0 &&
    Number.isFinite(params.insertWeightGrains) &&
    params.insertWeightGrains >= 0 &&
    Number.isFinite(params.nockWeightGrains) &&
    params.nockWeightGrains >= 0 &&
    masses.vaneMassGrains !== null &&
    masses.componentMassGrains > 0
  );
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

function buildWarnings(params, totalMassGr, focPercent, vaneMassGrains) {
  const warnings = [];
  if (params.massMode === 'components' && params.shaftGpi <= 0) warnings.push('GPI manquant: masse par composants indisponible.');
  if (params.massMode === 'components' && vaneMassGrains === null) warnings.push('Poids total d’empennage non renseigné: il n’est pas inclus dans la masse par composants.');
  if (totalMassGr <= 0) warnings.push('Masse totale invalide.');
  if (Number.isFinite(focPercent) && focPercent < 7) warnings.push('FOC bas: tendance possible à une stabilité de pointe plus faible.');
  if (Number.isFinite(focPercent) && focPercent > 18) warnings.push('FOC élevé: trajectoire et réglage à valider au pas de tir.');
  return warnings;
}

function positiveMass(value) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function explicitMassOrNull(value) {
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export const ARROW_BUILDER_DOC = 'Calcule les données de flèche sans inventer de recommandation spine.';

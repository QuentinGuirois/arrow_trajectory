// tuning-diagnostics.js
// Modèle faible complexité: deux oscillateurs amortis pour porpoising et fishtailing.

import { clamp } from './units.js';

export function calculateTuningModel(params, arrow) {
  const spineMismatch = arrow.dynamicSpineFactor - 1;
  const releaseScale = params.releaseType === 'fingers' ? 1.25 : 0.65;
  const spinDamping = clamp(arrow.spinStabilization / 2.2, 0.25, 1.4);

  const verticalAmplitudeCm =
    Math.abs(params.nockingPointOffsetMm) * 0.25 +
    Math.abs(params.releaseErrorVerticalMm) * 0.2 +
    (params.releaseType === 'fingers' ? 0.8 : 0.3);

  const lateralAmplitudeCm =
    Math.abs(params.centerShotMm) * 0.22 +
    Math.abs(params.releaseErrorLateralMm) * 0.22 +
    Math.abs(spineMismatch) * 9 +
    (1 - params.plungerStiffness) * 1.4 * releaseScale;

  const verticalFrequencyHz = 13 + params.drawWeightLbs * 0.08 + (600 / Math.max(250, params.spineStatic)) * 2;
  const lateralFrequencyHz = 11 + params.arrowLengthIn * 0.08 + Math.abs(spineMismatch) * 4;
  const verticalDamping = clamp(1.8 + spinDamping * 0.8 + arrow.vaneDragFactor * 0.35, 1.3, 4.5);
  const lateralDamping = clamp(1.5 + spinDamping * 1.1 + arrow.vaneDragFactor * 0.45, 1.2, 5);

  return {
    spineMismatch,
    verticalAmplitudeCm,
    lateralAmplitudeCm,
    verticalFrequencyHz,
    lateralFrequencyHz,
    verticalDamping,
    lateralDamping,
    spinDamping,
    diagnostics: buildDiagnostics(params, arrow, verticalAmplitudeCm, lateralAmplitudeCm)
  };
}

export function oscillationAt(time, model) {
  const vertical = model.verticalAmplitudeCm *
    Math.exp(-model.verticalDamping * time) *
    Math.sin(2 * Math.PI * model.verticalFrequencyHz * time);
  const lateralSign = model.spineMismatch >= 0 ? 1 : -1;
  const lateral = lateralSign * model.lateralAmplitudeCm *
    Math.exp(-model.lateralDamping * time) *
    Math.sin(2 * Math.PI * model.lateralFrequencyHz * time + Math.PI / 5);
  return { verticalCm: vertical, lateralCm: lateral };
}

function buildDiagnostics(params, arrow, verticalAmplitudeCm, lateralAmplitudeCm) {
  const items = [];
  items.push({
    label: 'Risque de porpoising',
    level: verticalAmplitudeCm > 2.5 ? 'élevé' : verticalAmplitudeCm > 1.2 ? 'modéré' : 'faible',
    detail: 'Piloté par nocking point, sortie verticale et erreur de décoche.'
  });
  items.push({
    label: 'Risque de fishtailing',
    level: lateralAmplitudeCm > 3 ? 'élevé' : lateralAmplitudeCm > 1.4 ? 'modéré' : 'faible',
    detail: 'Piloté par spine dynamique, center shot/plunger et sortie latérale.'
  });
  items.push({
    label: 'Risque de dérive au vent',
    level: params.windSpeedKmh > 18 ? 'élevé' : params.windSpeedKmh > 8 ? 'modéré' : 'faible',
    detail: 'Augmente avec temps de vol, surface latérale et vent de travers.'
  });
  items.push({
    label: 'Cohérence spine',
    level: Math.abs(arrow.dynamicSpineFactor - 1) > 0.22 ? 'à vérifier' : 'cohérent',
    detail: `Facteur dynamique ${arrow.dynamicSpineFactor.toFixed(2)}; cible pratique proche de 1.00.`
  });
  return items;
}

export const TUNING_DOC = 'Porpoising et fishtailing sont modélisés par deux oscillateurs amortis; spin stabilise/amortit.';

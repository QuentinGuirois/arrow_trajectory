// tuning-diagnostics.js
// Diagnostics comparatifs. Aucun verdict spine chiffré n'est produit sans table fabricant.

import { clamp } from './units.js';

export function calculateTuningModel(params, arrow) {
  const releaseScale = params.releaseType === 'fingers' ? 1.15 : 0.75;
  const spinDamping = clamp(arrow.spinStabilization / 2.2, 0.25, 1.4);

  const verticalAmplitudeCm =
    Math.abs(params.nockingPointOffsetMm) * 0.25 +
    Math.abs(params.releaseErrorVerticalMm) * 0.2 +
    (params.releaseType === 'fingers' ? 0.6 : 0.25);

  const lateralAmplitudeCm =
    Math.abs(params.centerShotMm) * 0.22 +
    Math.abs(params.releaseErrorLateralMm) * 0.22 +
    (1 - params.plungerStiffness) * 1.2 * releaseScale;

  const verticalFrequencyHz = 13 + params.drawWeightLbs * 0.06;
  const lateralFrequencyHz = 11 + params.arrowLengthIn * 0.07;
  const verticalDamping = clamp(1.8 + spinDamping * 0.8 + arrow.vaneDragFactor * 0.35, 1.3, 4.5);
  const lateralDamping = clamp(1.5 + spinDamping * 1.1 + arrow.vaneDragFactor * 0.45, 1.2, 5);

  return {
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
  const lateral = model.lateralAmplitudeCm *
    Math.exp(-model.lateralDamping * time) *
    Math.sin(2 * Math.PI * model.lateralFrequencyHz * time + Math.PI / 5);
  return { verticalCm: vertical, lateralCm: lateral };
}

function buildDiagnostics(params, arrow, verticalAmplitudeCm, lateralAmplitudeCm) {
  return [
    {
      label: 'Porpoising',
      level: verticalAmplitudeCm > 2.5 ? 'élevé' : verticalAmplitudeCm > 1.2 ? 'modéré' : 'faible',
      detail: 'Indicateur comparatif piloté par nocking point et sortie verticale.'
    },
    {
      label: 'Fishtailing',
      level: lateralAmplitudeCm > 3 ? 'élevé' : lateralAmplitudeCm > 1.4 ? 'modéré' : 'faible',
      detail: 'Indicateur comparatif piloté par center shot/plunger et sortie latérale.'
    },
    {
      label: 'Dérive au vent',
      level: params.windSpeedKmh > 18 ? 'élevé' : params.windSpeedKmh > 8 ? 'modéré' : 'faible',
      detail: 'Dépend du temps de vol, du vent latéral et de la surface exposée.'
    },
    {
      label: 'Spine',
      level: arrow.spineLookup.confidence === 'table' ? 'table chargée' : 'donnée non disponible',
      detail: arrow.spineLookup.notes
    }
  ];
}

export const TUNING_DOC = 'Porpoising/fishtailing restent des diagnostics comparatifs séparés de la trajectoire.';

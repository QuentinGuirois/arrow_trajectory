// draw-weight.js
// Résout la puissance réellement utilisée pour la sélection de spine.

import { normalizeBowType } from './bow-utils.js';

const RECURVE_LBS_PER_INCH = 2.5;

export function resolveEffectiveDrawWeight(params = {}) {
  const bowType = normalizeBowType(params.bowType);
  const drawWeightLbs = Number(params.drawWeightLbs);
  const drawLengthIn = Number(params.drawLengthIn);
  const drawWeightBasis = params.drawWeightBasis || (
    params.isDrawWeightMeasuredAtDraw || params.drawWeightMeasuredAtDraw ? 'actual' : 'at-28'
  );
  const notes = [];

  if (!Number.isFinite(drawWeightLbs)) {
    return {
      effectiveDrawWeightLbs: null,
      source: 'unavailable',
      notes: ['Puissance utilisable indisponible.']
    };
  }

  if (drawWeightBasis === 'actual' || params.isDrawWeightMeasuredAtDraw || params.drawWeightMeasuredAtDraw) {
    notes.push('Puissance saisie considérée comme mesurée à l’allonge.');
    return {
      effectiveDrawWeightLbs: drawWeightLbs,
      source: 'actual',
      notes
    };
  }

  if (bowType === 'compound') {
    notes.push('Compound : la puissance saisie est utilisée telle quelle pour les tables spine.');
    if (Number.isFinite(drawLengthIn) && drawLengthIn !== 28) {
      notes.push('L’allonge est notée, sans correction linéaire de puissance.');
    }
    return {
      effectiveDrawWeightLbs: drawWeightLbs,
      source: 'compound-unadjusted',
      notes
    };
  }

  if ((bowType === 'recurve' || bowType === 'traditional') && Number.isFinite(drawLengthIn)) {
    const effectiveDrawWeightLbs = drawWeightLbs + (drawLengthIn - 28) * RECURVE_LBS_PER_INCH;
    notes.push('Puissance ajustée depuis une référence à 28 pouces.');
    return {
      effectiveDrawWeightLbs: roundToTenth(Math.max(0, effectiveDrawWeightLbs)),
      source: 'estimated-from-28',
      notes
    };
  }

  notes.push('Allonge indisponible : puissance saisie utilisée telle quelle.');
  return {
    effectiveDrawWeightLbs: drawWeightLbs,
    source: 'fallback-raw',
    notes
  };
}

function roundToTenth(value) {
  return Math.round(value * 10) / 10;
}

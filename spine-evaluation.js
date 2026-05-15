// spine-evaluation.js
// Comparaison pure entre le spine saisi et une fourchette conseillée.

import { clamp } from './units.js';

export function compareCurrentSpineToRange(spineStatic, rangeMin, rangeMax) {
  const range = normalizeRange(rangeMin, rangeMax);
  if (!Number.isFinite(spineStatic) || !range) {
    return {
      status: 'unknown',
      label: 'comparaison indisponible'
    };
  }

  if (spineStatic < range.min) {
    return {
      status: 'too-stiff',
      label: 'plus raide que la fourchette'
    };
  }

  if (spineStatic > range.max) {
    return {
      status: 'too-soft',
      label: 'plus souple que la fourchette'
    };
  }

  return {
    status: 'in-range',
    label: 'dans la fourchette'
  };
}

export const compareCurrentSpineToRecommendation = compareCurrentSpineToRange;

export function computeSpineMismatch(spineStatic, suggestedSpine, rangeMin, rangeMax) {
  const range = normalizeRange(rangeMin, rangeMax);
  const referenceSpine = Number.isFinite(suggestedSpine)
    ? suggestedSpine
    : range
      ? (range.min + range.max) / 2
      : NaN;
  if (!Number.isFinite(spineStatic) || !Number.isFinite(referenceSpine) || !range) {
    return {
      status: 'unknown',
      severity: 0,
      signedRatio: 0
    };
  }

  const comparison = compareCurrentSpineToRange(spineStatic, range.min, range.max);
  const width = Math.max(50, range.max - range.min);
  const signedRatio = (spineStatic - referenceSpine) / Math.max(1, referenceSpine);

  if (comparison.status === 'in-range') {
    return {
      status: 'in-range',
      severity: 0,
      signedRatio
    };
  }

  const boundaryDelta = comparison.status === 'too-stiff'
    ? range.min - spineStatic
    : spineStatic - range.max;

  return {
    status: comparison.status,
    severity: clamp(boundaryDelta / width, 0, 1),
    signedRatio
  };
}

export function spineMismatchMessage(status) {
  if (status === 'too-soft') {
    return 'Spine plus souple que la fourchette : risque de fishtailing accru.';
  }
  if (status === 'too-stiff') {
    return 'Spine plus raide que la fourchette : sortie latérale potentiellement moins tolérante.';
  }
  if (status === 'in-range') {
    return 'Spine dans la fourchette : risque spine modéré.';
  }
  return 'Comparaison spine indisponible.';
}

function normalizeRange(rangeMin, rangeMax) {
  if (!Number.isFinite(rangeMin) || !Number.isFinite(rangeMax)) return null;
  return {
    min: Math.min(rangeMin, rangeMax),
    max: Math.max(rangeMin, rangeMax)
  };
}

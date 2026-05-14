// calibration.js
// Vitesse de sortie: la saisie chrono/utilisateur est la source de vérité.

import { fpsToMetersPerSecond, clamp } from './units.js';
import { interpolatePointAtDistance } from './util.js';

export function resolveLaunch(params) {
  const fps = clamp(params.fps, 80, 420);
  // Si la vitesse est mesurée au chronographe, elle ne doit pas être recalculée depuis la masse de flèche.
  return {
    fps,
    speedMps: fpsToMetersPerSecond(fps),
    source: 'saisie chrono/utilisateur',
    experimental: false,
    notes: ['La masse influence énergie, momentum et traînée, mais ne modifie pas une vitesse chrono mesurée.']
  };
}

export function buildSightMarks(points, params) {
  const distances = [10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];
  return distances.map(distance => {
    const p = interpolatePointAtDistance(points, distance);
    if (!p) return null;
    const scopeY = (params.shootingHeight + params.scopeOffset) + p.x * Math.tan(params.scopeAngleDeg * Math.PI / 180);
    return {
      distance,
      holdoverCm: (p.y - scopeY) * 100,
      driftCm: p.z * 100,
      time: p.time,
      energy: p.energy
    };
  }).filter(Boolean);
}

export const CALIBRATION_DOC = 'La vitesse fps saisie est prioritaire. Les estimations depuis marks/géométrie ont été retirées.';

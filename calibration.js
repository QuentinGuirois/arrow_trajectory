// calibration.js
// Modes de calibration vitesse/sight marks. Les estimations hors chronographe sont expérimentales.

import { fpsToMetersPerSecond, metersPerSecondToFPS, clamp } from './units.js';
import { estimateLaunchFromForceCurve } from './physics-advanced.js';

export function resolveLaunch(params, arrow) {
  const notes = [];
  let fps = params.fps;
  let source = 'saisie utilisateur';
  let experimental = false;

  if (params.calibrationMode === 'chrono' && params.chronoFps > 0) {
    fps = params.chronoFps;
    source = 'chronographe';
  } else if (params.calibrationMode === 'two_marks') {
    const estimated = estimateFpsFromTwoMarks(params);
    if (estimated) {
      fps = estimated;
      source = '2 sight marks';
      experimental = true;
      notes.push('Estimation par marks: suppose angle de tir faible et repères cohérents.');
    }
  } else if (params.calibrationMode === 'reference_geometry') {
    const estimated = estimateFpsFromReference(params);
    if (estimated) {
      fps = estimated;
      source = 'repère + géométrie';
      experimental = true;
      notes.push('Estimation géométrique simplifiée: à valider au pas de tir.');
    }
  }

  if (params.forceCurveEnabled) {
    const force = estimateLaunchFromForceCurve(params, arrow);
    if (force.fps > 0) {
      fps = force.fps;
      source = 'courbe force-allonge';
      experimental = true;
      notes.push(force.note);
    }
  }

  return {
    fps: clamp(fps, 80, 420),
    speedMps: fpsToMetersPerSecond(clamp(fps, 80, 420)),
    source,
    experimental,
    notes
  };
}

function estimateFpsFromTwoMarks(params) {
  const d1 = params.sightDistance1M;
  const d2 = params.sightDistance2M;
  const deltaDropM = Math.abs((params.sightHold2Cm - params.sightHold1Cm) / 100);
  if (d2 <= d1 || deltaDropM < 0.02) return null;
  const v = Math.sqrt((9.81 * (d2 * d2 - d1 * d1)) / (2 * deltaDropM));
  return metersPerSecondToFPS(v);
}

function estimateFpsFromReference(params) {
  const d = params.referenceDistanceM;
  const dropM = Math.abs(params.referenceDropCm / 100);
  if (d <= 0 || dropM < 0.01) return null;
  const v = Math.sqrt((9.81 * d * d) / (2 * dropM));
  return metersPerSecondToFPS(v);
}

export function buildSightMarks(points, params) {
  const distances = [10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];
  return distances.map(distance => {
    const p = findPointAtDistance(points, distance);
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

function findPointAtDistance(points, distance) {
  for (let i = 1; i < points.length; i++) {
    if (points[i].x >= distance) {
      const a = points[i - 1];
      const b = points[i];
      const t = (distance - a.x) / Math.max(0.000001, b.x - a.x);
      return {
        x: distance,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t,
        time: a.time + (b.time - a.time) * t,
        energy: a.energy + (b.energy - a.energy) * t
      };
    }
  }
  return null;
}

export const CALIBRATION_DOC = 'Chronographe prioritaire; modes sight marks et géométrie sont des approximations expérimentales.';

// trajectory.worker-archery.js
// Solveur balistique 3D exécuté dans un Web Worker.

import { buildArrow } from './arrow-builder.js';
import { resolveLaunch } from './calibration.js';
import { calculateTuningModel, oscillationAt } from './tuning-diagnostics.js';
import {
  PHYSICS_CONSTANTS,
  buildInitialVelocity,
  computeAdvancedCd,
} from './physics-advanced.js';
import { calculateEnergy, metersPerSecondToFPS } from './physics-archery.js';
import { normalizeSimulationParams } from './simulation-params.js';

function solveTrajectory3D(params, simulationInput) {
  const arrow = buildArrow(params);
  const launch = resolveLaunch(params, arrow);
  const tuning = calculateTuningModel(params, arrow);
  // Le worker accepte désormais le contrat physique normalisé, tout en conservant
  // les paramètres plats legacy pour les sous-modèles encore non migrés.
  const simulation = simulationInput ?? normalizeSimulationParams(params, { arrow, launch });
  const rho = simulation.atmosphere.densityKgM3;
  const wind = simulation.wind.vectorMps;
  const velocity = buildInitialVelocity(params, launch);
  const dt = params.dt || 0.001;
  const maxIterations = 120000;

  let x = 0;
  let y = simulation.launch.heightM;
  let z = 0;
  let vx = velocity.x;
  let vy = velocity.y;
  let vz = velocity.z;
  let time = 0;
  const positions = [];
  const initialSpeed = Math.hypot(vx, vy, vz);
  const initialTune = oscillationAt(0, tuning);
  positions.push(buildPoint({
    x,
    y,
    z,
    vx,
    vy,
    vz,
    time,
    arrow,
    speed: initialSpeed,
    tune: initialTune,
    aoaRad: estimateDiagnosticAoaRad(initialTune, initialSpeed),
    cd: 0,
    params
  }));

  for (let iter = 0; iter < maxIterations; iter++) {
    if (y < 0) break;
    const prev = { x, y, z, time };
    const relVx = vx - wind.x;
    const relVy = vy - wind.y;
    const stabilityWindFactor = 1 + Math.max(0, 1.1 - arrow.vaneDragFactor) * 0.15;
    const relVz = vz - wind.z * stabilityWindFactor;
    const relSpeed = Math.hypot(relVx, relVy, relVz);
    if (relSpeed < 0.05) break;

    const tune = oscillationAt(time, tuning);
    const aoaRad = estimateDiagnosticAoaRad(tune, relSpeed);
    const cd = computeAdvancedCd(params, arrow, relSpeed, 0, rho);
    const drag = 0.5 * rho * cd * arrow.frontalAreaM2 * relSpeed * relSpeed;
    const ax = -(drag / arrow.totalMassKg) * (relVx / relSpeed);
    const ay = -(drag / arrow.totalMassKg) * (relVy / relSpeed) - PHYSICS_CONSTANTS.gravity;
    const az = -(drag / arrow.totalMassKg) * (relVz / relSpeed);

    vx += ax * dt;
    vy += ay * dt;
    vz += az * dt;
    x += vx * dt;
    y += vy * dt;
    z += vz * dt;
    time += dt;

    const speed = Math.hypot(vx, vy, vz);
    const point = buildPoint({ x, y, z, vx, vy, vz, time, arrow, speed, tune, aoaRad, cd, params });
    if (y <= 0) {
      const ratio = prev.y / Math.max(0.000001, prev.y - y);
      point.x = prev.x + (x - prev.x) * ratio;
      point.y = 0;
      point.z = prev.z + (z - prev.z) * ratio;
      point.time = prev.time + dt * ratio;
      positions.push(point);
      break;
    }
    positions.push(point);
    if (time > 10 || x > 250) break;
  }

  const finalPoint = positions[positions.length - 1];
  return {
    positions,
    arrow,
    launch,
    tuning,
    simulation,
    environment: { airDensity: rho, wind },
    stats: calculateStats(positions, arrow, finalPoint)
  };
}

function buildPoint({ x, y, z, vx, vy, vz, time, arrow, speed, tune, aoaRad, cd, params }) {
  const dispersionBase = params.dispersionEnabled
    ? Math.hypot(params.releaseErrorVerticalMm, params.releaseErrorLateralMm, params.gustPercent * 0.04) * 0.35 + 0.8
    : 0;
  return {
    x,
    y,
    z,
    vx,
    vy,
    vz,
    time,
    speed,
    fps: metersPerSecondToFPS(speed),
    energy: calculateEnergy(arrow.totalMassKg, speed),
    momentum: arrow.totalMassKg * speed,
    porpoiseCm: tune.verticalCm,
    fishtailCm: tune.lateralCm,
    aoaDeg: aoaRad * 180 / Math.PI,
    cd,
    dispersionRadiusCm: dispersionBase * (1 + x / 65)
  };
}

function estimateDiagnosticAoaRad(tune, speed) {
  const oscillationSlope = Math.hypot(tune.verticalCm, tune.lateralCm) / 100;
  return Math.min(0.18, oscillationSlope / Math.max(8, speed));
}

function calculateStats(points, arrow, finalPoint) {
  if (!points.length || !finalPoint) {
    return { portée: 0, hauteur: 0, tvol: 0, vfinal: 0, energyImpact: 0, momentumImpact: 0, driftImpactCm: 0, impactAngleDeg: 0 };
  }
  const maxY = points.reduce((max, p) => Math.max(max, p.y), -Infinity);
  return {
    portée: finalPoint.x,
    hauteur: maxY,
    tvol: finalPoint.time,
    vfinal: finalPoint.fps,
    energyImpact: finalPoint.energy,
    momentumImpact: finalPoint.momentum,
    driftImpactCm: finalPoint.z * 100,
    impactAngleDeg: Math.atan2(finalPoint.vy, Math.hypot(finalPoint.vx, finalPoint.vz)) * 180 / Math.PI,
    focPercent: arrow.focPercent,
    stabilityLabel: arrow.stabilityLabel
  };
}

self.onmessage = (e) => {
  if (e.data?.type !== 'calcTrajArchery') return;
  try {
    const { params, simulation, requestId } = e.data;
    const result = solveTrajectory3D(params, simulation);
    self.postMessage({ ok: true, requestId, ...result });
  } catch (err) {
    self.postMessage({ ok: false, requestId: e.data?.requestId, error: String(err?.stack || err) });
  }
};

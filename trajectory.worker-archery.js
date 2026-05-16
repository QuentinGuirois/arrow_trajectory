// trajectory.worker-archery.js
// Solveur balistique 3D exécuté dans un Web Worker.
// Ce moteur simule le centre de masse de la flèche, pas sa flexion.

import { buildArrow } from './arrow-builder.js';
import { resolveLaunch } from './calibration.js';
import { calculateTuningModel, oscillationAt } from './tuning-diagnostics.js';
import {
  PHYSICS_CONSTANTS,
  buildInitialVelocity,
  computeAdvancedCd,
} from './physics-advanced.js';
import { calculateEnergy, metersPerSecondToFPS } from './physics-archery.js';
import {
  normalizeLegacySimulationParams,
  normalizeSimulationParams
} from './simulation-params.js';
import { POINT_MASS_3D_MODEL_VERSION } from './util.js';

const DEFAULT_DT_S = 0.001;
const MIN_DT_S = 0.0001;
const MAX_DT_S = 0.02;
const MAX_TIME_S = 10;
const MAX_DISTANCE_M = 250;
const MIN_RELATIVE_SPEED_MPS = 0.05;

// Convention du solveur :
// x = distance vers la cible, y = dérive latérale, z = hauteur.
export function calculateTrajectory3D(simParams = {}) {
  const inputParams = simParams.params ?? simParams;
  const params = normalizeLegacySimulationParams(inputParams);
  const arrow = buildArrow(params);
  const launch = resolveLaunch(params, arrow);
  const tuning = calculateTuningModel(params, arrow);
  const simulation = simParams.simulation ?? normalizeSimulationParams(params, { arrow, launch });
  const rho = finiteOr(simulation.atmosphere?.densityKgM3, 1.2);
  const dynamicViscosity = finiteOr(
    simulation.atmosphere?.dynamicViscosityPaS,
    PHYSICS_CONSTANTS.airViscosity
  );
  const wind = finiteVector3(simulation.wind?.vectorMps);
  const area = Math.PI * Math.pow(simulation.arrow.diameterM, 2) / 4;
  const dt = resolveTimeStep(params.dt);
  const maxTimeS = finitePositiveOr(params.maxTimeS, MAX_TIME_S);
  const maxDistanceM = finitePositiveOr(params.maxDistanceM, MAX_DISTANCE_M);
  const maxIterations = Math.ceil(maxTimeS / dt) + 1;
  const velocity = buildInitialVelocity(params, launch);

  let x = 0;
  let y = 0;
  let z = simulation.launch.heightM;
  let vx = velocity.x;
  let vy = velocity.y;
  let vz = velocity.z;
  let time = 0;

  const positions = [];
  const initialRel = relativeVelocity({ vx, vy, vz }, wind);
  const initialRelSpeed = Math.hypot(initialRel.x, initialRel.y, initialRel.z);
  const initialRe = calculateReynoldsNumber(rho, initialRelSpeed, simulation.arrow.diameterM, dynamicViscosity);
  const initialTune = oscillationAt(0, tuning);
  const initialCd = computeAdvancedCd(params, arrow, initialRelSpeed, 0, rho);
  positions.push(buildPoint({
    x,
    y,
    z,
    vx,
    vy,
    vz,
    time,
    arrow,
    speedMps: Math.hypot(vx, vy, vz),
    relativeSpeedMps: initialRelSpeed,
    launchHeightM: simulation.launch.heightM,
    tune: initialTune,
    aoaRad: estimateDiagnosticAoaRad(initialTune, initialRelSpeed),
    cd: initialCd,
    re: initialRe,
    params
  }));

  for (let iter = 0; iter < maxIterations; iter++) {
    if (z <= 0 || time >= maxTimeS || Math.abs(x) >= maxDistanceM) break;

    const previous = { x, y, z, vx, vy, vz, time };
    const rel = relativeVelocity({ vx, vy, vz }, wind);
    const relativeSpeedMps = Math.hypot(rel.x, rel.y, rel.z);
    if (!Number.isFinite(relativeSpeedMps) || relativeSpeedMps < MIN_RELATIVE_SPEED_MPS) break;

    const tune = oscillationAt(time, tuning);
    const aoaRad = estimateDiagnosticAoaRad(tune, relativeSpeedMps);
    const cd = computeAdvancedCd(params, arrow, relativeSpeedMps, 0, rho);
    const re = calculateReynoldsNumber(rho, relativeSpeedMps, simulation.arrow.diameterM, dynamicViscosity);

    // Fd = -0.5 * rho * Cd * area * |vRel| * vRel
    const dragFactor = -0.5 * rho * cd * area * relativeSpeedMps / arrow.totalMassKg;
    const ax = dragFactor * rel.x;
    const ay = dragFactor * rel.y;
    const az = dragFactor * rel.z - PHYSICS_CONSTANTS.gravity;

    vx += ax * dt;
    vy += ay * dt;
    vz += az * dt;
    x += vx * dt;
    y += vy * dt;
    z += vz * dt;
    time += dt;

    const next = { x, y, z, vx, vy, vz, time };
    if (!isFiniteState(next)) break;

    if (z <= 0) {
      const ratio = previous.z / Math.max(0.000001, previous.z - z);
      const impact = interpolateState(previous, next, ratio);
      const impactTune = oscillationAt(impact.time, tuning);
      const impactRel = relativeVelocity(impact, wind);
      const impactRelSpeed = Math.hypot(impactRel.x, impactRel.y, impactRel.z);
      const impactRe = calculateReynoldsNumber(rho, impactRelSpeed, simulation.arrow.diameterM, dynamicViscosity);
      const impactCd = computeAdvancedCd(params, arrow, impactRelSpeed, 0, rho);
      positions.push(buildPoint({
        ...impact,
        z: 0,
        arrow,
        speedMps: Math.hypot(impact.vx, impact.vy, impact.vz),
        relativeSpeedMps: impactRelSpeed,
        launchHeightM: simulation.launch.heightM,
        tune: impactTune,
        aoaRad: estimateDiagnosticAoaRad(impactTune, impactRelSpeed),
        cd: impactCd,
        re: impactRe,
        params
      }));
      break;
    }

    positions.push(buildPoint({
      x,
      y,
      z,
      vx,
      vy,
      vz,
      time,
      arrow,
      speedMps: Math.hypot(vx, vy, vz),
      relativeSpeedMps,
      launchHeightM: simulation.launch.heightM,
      tune,
      aoaRad,
      cd,
      re,
      params
    }));
  }

  const finalPoint = positions[positions.length - 1];
  return {
    modelVersion: POINT_MASS_3D_MODEL_VERSION,
    positions,
    arrow,
    launch,
    tuning,
    simulation,
    environment: { airDensity: rho, wind },
    stats: calculateStats(positions, arrow, finalPoint)
  };
}

function buildPoint({
  x,
  y,
  z,
  vx,
  vy,
  vz,
  time,
  arrow,
  speedMps,
  relativeSpeedMps,
  launchHeightM,
  tune,
  aoaRad,
  cd,
  re,
  params
}) {
  const dispersionBase = params.dispersionEnabled
    ? Math.hypot(params.releaseErrorVerticalMm, params.releaseErrorLateralMm, params.gustPercent * 0.04) * 0.35 + 0.8
    : 0;
  const energyJ = calculateEnergy(arrow.totalMassKg, speedMps);
  return {
    modelVersion: POINT_MASS_3D_MODEL_VERSION,
    x,
    y,
    z,
    vx,
    vy,
    vz,
    time,
    speedMps,
    // Aliases conservés pendant la migration des consommateurs historiques.
    speed: speedMps,
    fps: metersPerSecondToFPS(speedMps),
    energyJ,
    energy: energyJ,
    momentum: arrow.totalMassKg * speedMps,
    driftM: y,
    dropM: launchHeightM - z,
    re,
    cd,
    aeroRegime: classifyAeroRegime(re),
    relativeSpeedMps,
    porpoiseCm: tune.verticalCm,
    fishtailCm: tune.lateralCm,
    aoaDeg: aoaRad * 180 / Math.PI,
    dispersionRadiusCm: dispersionBase * (1 + x / 65)
  };
}

function relativeVelocity(velocity, wind) {
  return {
    x: velocity.vx - wind.x,
    y: velocity.vy - wind.y,
    z: velocity.vz - wind.z
  };
}

function calculateReynoldsNumber(rho, relativeSpeedMps, diameterM, dynamicViscosityPaS) {
  return rho * relativeSpeedMps * diameterM / dynamicViscosityPaS;
}

function classifyAeroRegime(reynolds) {
  if (!Number.isFinite(reynolds)) return 'unknown';
  if (reynolds < 20000) return 'low-Re';
  if (reynolds < 80000) return 'mid-Re';
  return 'high-Re';
}

function estimateDiagnosticAoaRad(tune, speed) {
  const oscillationSlope = Math.hypot(tune.verticalCm, tune.lateralCm) / 100;
  return Math.min(0.18, oscillationSlope / Math.max(8, speed));
}

function calculateStats(points, arrow, finalPoint) {
  if (!points.length || !finalPoint) {
    return { portée: 0, hauteur: 0, tvol: 0, vfinal: 0, energyImpact: 0, momentumImpact: 0, driftImpactCm: 0, impactAngleDeg: 0 };
  }
  const maxZ = points.reduce((max, p) => Math.max(max, p.z), -Infinity);
  return {
    portée: finalPoint.x,
    hauteur: maxZ,
    tvol: finalPoint.time,
    vfinal: finalPoint.fps,
    energyImpact: finalPoint.energyJ,
    momentumImpact: finalPoint.momentum,
    driftImpactCm: finalPoint.y * 100,
    impactAngleDeg: Math.atan2(finalPoint.vz, Math.hypot(finalPoint.vx, finalPoint.vy)) * 180 / Math.PI,
    focPercent: arrow.focPercent,
    stabilityLabel: arrow.stabilityLabel
  };
}

function interpolateState(a, b, ratio) {
  return {
    x: a.x + (b.x - a.x) * ratio,
    y: a.y + (b.y - a.y) * ratio,
    z: a.z + (b.z - a.z) * ratio,
    vx: a.vx + (b.vx - a.vx) * ratio,
    vy: a.vy + (b.vy - a.vy) * ratio,
    vz: a.vz + (b.vz - a.vz) * ratio,
    time: a.time + (b.time - a.time) * ratio
  };
}

function resolveTimeStep(value) {
  const dt = finitePositiveOr(value, DEFAULT_DT_S);
  return Math.min(MAX_DT_S, Math.max(MIN_DT_S, dt));
}

function finitePositiveOr(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function finiteVector3(vector = {}) {
  return {
    x: finiteOr(vector.x, 0),
    y: finiteOr(vector.y, 0),
    z: finiteOr(vector.z, 0)
  };
}

function isFiniteState(state) {
  return [
    state.x,
    state.y,
    state.z,
    state.vx,
    state.vy,
    state.vz,
    state.time
  ].every(Number.isFinite);
}

if (typeof self !== 'undefined') {
  self.onmessage = (e) => {
    if (e.data?.type !== 'calcTrajArchery') return;
    try {
      const { params, simulation, requestId } = e.data;
      const result = calculateTrajectory3D({ params, simulation });
      self.postMessage({ ok: true, requestId, ...result });
    } catch (err) {
      self.postMessage({ ok: false, requestId: e.data?.requestId, error: String(err?.stack || err) });
    }
  };
}

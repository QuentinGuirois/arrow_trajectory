// trajectory.worker-archery.js
import { computeCd, calculateAirDensity, calculateEnergy, fpsToMetersPerSecond, metersPerSecondToFPS } from './physics-archery.js';

const g = 9.81;

function calculateTrajectory2D(fps, poidsGr, angleDeg, diameter, plumeType, params) {
  const {
    pressureHpa = 1020,
    temperatureCelsius = 20,
    dt = 0.0005,
    shootingHeight = 1.5
  } = params || {};

  const initialSpeed = fpsToMetersPerSecond(fps);
  const mass = poidsGr / 1000;
  const angleRad = angleDeg * Math.PI / 180;

  let x = 0;
  let y = shootingHeight;
  let velocityX = initialSpeed * Math.cos(angleRad);
  let velocityY = initialSpeed * Math.sin(angleRad);

  const rho_air = calculateAirDensity(temperatureCelsius, pressureHpa);
  const radius = diameter / 2;
  const area = Math.PI * radius * radius;

  let time = 0;
  const positions = [];

  for (let iter = 0; iter < 100000; iter++) {
    if (y < 0) break;
    const velocity = Math.hypot(velocityX, velocityY);
    if (!velocity) break;

    const Cd = computeCd(plumeType, diameter, velocity);
    const dragForce = 0.5 * rho_air * Cd * area * velocity * velocity;

    const v_unit_x = velocityX / velocity;
    const v_unit_y = velocityY / velocity;
    const F_dragX = -dragForce * v_unit_x;
    const F_dragY = -dragForce * v_unit_y;

    const ax = F_dragX / mass;
    const ay = (F_dragY / mass) - g;

    velocityX += ax * dt;
    velocityY += ay * dt;
    x += velocityX * dt;
    y += velocityY * dt;

    const energy = calculateEnergy(mass, velocity);
    const fpsVal = metersPerSecondToFPS(velocity);
    positions.push({ x, y, energy, fps: fpsVal, time });

    time += dt;
    if (y <= 0) {
      positions[positions.length - 1].y = 0;
      break;
    }
    if (time > 8 && velocity < 0.5) break;
  }
  return positions;
}

self.onmessage = (e) => {
  if (e.data?.type !== 'calcTrajArchery') return;
  try {
    const { fps, poids, angleDeg, diameter, plumeType, physParams } = e.data;
    const raw = calculateTrajectory2D(fps, poids, angleDeg, diameter, plumeType, physParams);
    self.postMessage({ ok: true, positions: raw });
  } catch (err) {
    self.postMessage({ ok: false, error: String(err) });
  }
};

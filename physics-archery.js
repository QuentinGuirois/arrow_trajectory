// physics-archery.js
export function computeCd(plumeType = "moyenne", diameter = 0.007, velocity = 60) {
  // plumeType: "petite", "moyenne", "grande", "hélicoïdale"
  let baseCd;
  switch (plumeType) {
    case "petite": baseCd = 1.5; break;
    case "moyenne": baseCd = 1.7; break;
    case "grande": baseCd = 2.0; break;
    case "hélicoïdale": baseCd = 2.1; break;
    default: baseCd = 1.7;
  }
  return baseCd;
}

export function calculateAirDensity(tempC, pHpa) {
  const R_specific = 287.058;
  const T = tempC + 273.15;
  const p = pHpa * 100;
  return p / (R_specific * T);
}

export function calculateEnergy(massKg, velocityMps) {
  return 0.5 * massKg * velocityMps * velocityMps;
}

export function fpsToMetersPerSecond(fps) { return fps * 0.3048; }
export function metersPerSecondToFPS(mps) { return mps / 0.3048; }

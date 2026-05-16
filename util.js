// util.js
// Helpers génériques conservés pour les modules futurs.

export function decimate(array, step = 10) {
  const out = [];
  for (let i = 0; i < array.length; i += step) out.push(array[i]);
  return out;
}

export function debounce(fn, wait = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function interpolatePointAtDistance(points, distanceM) {
  if (!points?.length) return null;
  if (distanceM <= points[0].x) return { ...points[0], distance: distanceM };
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (b.x >= distanceM) {
      const t = (distanceM - a.x) / Math.max(0.000001, b.x - a.x);
      const out = {
        distance: distanceM,
        ...(b.modelVersion ? { modelVersion: b.modelVersion } : {})
      };
      Object.keys(b).forEach(key => {
        if (typeof a[key] === 'number' && typeof b[key] === 'number') {
          out[key] = a[key] + (b[key] - a[key]) * t;
        }
      });
      return out;
    }
  }
  return null;
}

export const POINT_MASS_3D_MODEL_VERSION = 'pointMass3D-v1';

export function isPointMass3DPoint(point) {
  return point?.modelVersion === POINT_MASS_3D_MODEL_VERSION
    || (
      Number.isFinite(point?.driftM)
      && Number.isFinite(point?.dropM)
      && Number.isFinite(point?.speedMps)
    );
}

export function pointHeightM(point) {
  return isPointMass3DPoint(point) ? point.z : point.y;
}

export function pointDriftM(point) {
  return isPointMass3DPoint(point) ? point.y : point.z;
}

export function pointEnergyJ(point) {
  return Number.isFinite(point?.energyJ) ? point.energyJ : point?.energy;
}

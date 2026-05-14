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

export function interpolatePointAtDistance(points, distance) {
  if (!points?.length) return null;
  if (distance <= points[0].x) return { ...points[0], distance };
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (b.x >= distance) {
      const t = (distance - a.x) / Math.max(0.000001, b.x - a.x);
      const out = { distance };
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

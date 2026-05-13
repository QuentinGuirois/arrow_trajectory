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

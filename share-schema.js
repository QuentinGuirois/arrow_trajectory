// share-schema.js
// Schéma versionné pour URL de partage et compatibilité avec les anciens hashes key=value.

export const SHARE_SCHEMA_VERSION = 2;

export function encodeShare(params) {
  const payload = {
    v: SHARE_SCHEMA_VERSION,
    type: 'archery-setup',
    params
  };
  const json = JSON.stringify(payload);
  return `v${SHARE_SCHEMA_VERSION}:${btoa(unescape(encodeURIComponent(json)))}`;
}

export function decodeShare(hash) {
  const raw = hash.replace(/^#/, '');
  if (!raw) return null;
  if (raw.startsWith(`v${SHARE_SCHEMA_VERSION}:`)) {
    const encoded = raw.slice(3);
    const json = decodeURIComponent(escape(atob(encoded)));
    const payload = JSON.parse(json);
    return payload.params || null;
  }
  return decodeLegacy(raw);
}

function decodeLegacy(raw) {
  const obj = {};
  raw.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (!key) return;
    const decoded = decodeURIComponent(value || '');
    const numeric = Number(decoded);
    obj[key] = Number.isFinite(numeric) && decoded.trim() !== '' ? numeric : decoded;
  });
  return obj;
}

export function saveSetups(curves) {
  localStorage.setItem('archery.savedSetups.v2', JSON.stringify(curves.slice(-12)));
}

export function loadSetups() {
  try {
    return JSON.parse(localStorage.getItem('archery.savedSetups.v2') || '[]');
  } catch {
    return [];
  }
}

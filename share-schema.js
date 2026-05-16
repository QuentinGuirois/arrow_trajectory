// share-schema.js
// Schéma versionné pour URL de partage et compatibilité avec les anciens hashes key=value.

export const SHARE_SCHEMA_VERSION = 3;

export function encodeShare(session) {
  const payload = {
    v: SHARE_SCHEMA_VERSION,
    type: 'archery-session',
    session: normalizeSession(session)
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
    return normalizeSession(payload.session);
  }
  if (raw.startsWith('v2:')) {
    const encoded = raw.slice(3);
    const json = decodeURIComponent(escape(atob(encoded)));
    const payload = JSON.parse(json);
    return {
      currentParams: payload.params || null
    };
  }
  return {
    currentParams: decodeLegacy(raw)
  };
}

function normalizeSession(session = {}) {
  if (
    session &&
    typeof session === 'object' &&
    (
      Object.hasOwn(session, 'currentParams') ||
      Object.hasOwn(session, 'savedCurves') ||
      Object.hasOwn(session, 'currentCurve') ||
      Object.hasOwn(session, 'activeTab')
    )
  ) {
    return {
      currentParams: session.currentParams || null,
      savedCurves: Array.isArray(session.savedCurves) ? session.savedCurves : [],
      currentCurve: session.currentCurve || null,
      activeTab: session.activeTab || null
    };
  }
  return {
    currentParams: session || null,
    savedCurves: [],
    currentCurve: null,
    activeTab: null
  };
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

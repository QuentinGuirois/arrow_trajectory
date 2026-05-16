import test from 'node:test';
import assert from 'node:assert/strict';

import { decodeShare, encodeShare, SHARE_SCHEMA_VERSION } from '../share-schema.js';

test('share schema v3 round-trips the saved session payload', () => {
  const session = {
    currentParams: { setupName: 'Courant', fps: 205 },
    currentCurve: {
      params: { setupName: 'Courant', fps: 205 },
      curveData: [{ x: 0 }, { x: 1 }]
    },
    savedCurves: [
      {
        params: { setupName: 'Sauvé', fps: 190 },
        curveData: [{ x: 0 }, { x: 2 }]
      }
    ],
    activeTab: 'energyChart'
  };

  const hash = encodeShare(session);
  const decoded = decodeShare(`#${hash}`);

  assert.equal(SHARE_SCHEMA_VERSION, 3);
  assert.deepEqual(decoded, session);
});

test('share schema keeps v2 parameter-only links readable', () => {
  const payload = {
    v: 2,
    type: 'archery-setup',
    params: { setupName: 'Ancien lien', fps: 180 }
  };
  const legacyV2 = `v2:${btoa(unescape(encodeURIComponent(JSON.stringify(payload))))}`;

  assert.deepEqual(decodeShare(`#${legacyV2}`), {
    currentParams: payload.params
  });
});

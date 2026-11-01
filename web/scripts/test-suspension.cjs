const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('esbuild');

// Run the real service code with an in-memory Firestore boundary.
const records = [
  { id: 'legacy', data: () => ({ name: 'Legacy' }) },
  { id: 'hidden', data: () => ({ isSuspended: true }) },
  { id: 'old-hidden', data: () => ({ status: 'suspended' }) },
  { id: 'reactivated', data: () => ({ isSuspended: false, status: 'suspended' }) },
];
let writeError = false;
let written;
let snapshotListener;
const firestore = {
  collection: () => ({}), doc: (...args) => args,
  getDocs: async () => ({ docs: records, empty: false }),
  getDoc: async () => ({ id: 'hidden', exists: () => true, data: records[1].data }),
  updateDoc: async (_, fields) => {
    if (writeError) throw new Error('permission-denied');
    written = fields;
  },
  onSnapshot: (_, listener) => { snapshotListener = listener; return () => {}; },
};
const cache = new Map();
function load(relative) {
  const filename = path.resolve(__dirname, relative);
  const code = transformSync(readFileSync(filename, 'utf8'), { loader: 'ts', format: 'cjs' }).code;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports, console,
    require: (name) => name === 'firebase/firestore' ? firestore
      : name === 'firebase/storage' ? {}
      : name === '../firebase' ? { db: {}, isFirebaseConfigured: true } : {},
    localStorage: { getItem: (key) => cache.get(key), setItem: (key, value) => cache.set(key, value) },
  }, { filename });
  return module.exports;
}

(async () => {
  const { api } = load('../src/services/api.ts');
  const items = await api.getGuesthouses();
  assert.equal(items.length, 4, 'admins retain suspended listings');
  assert.equal(items[0].isSuspended, false, 'missing fields mean active');
  assert.equal(items[2].isSuspended, true, 'legacy status is supported');
  assert.equal(items[3].status, 'active', 'explicit boolean takes precedence');
  await api.suspendGuesthouse('legacy', true);
  assert.equal(written.isSuspended, true);
  assert.equal(written.status, 'suspended');
  writeError = true;
  await assert.rejects(api.suspendGuesthouse('legacy', false), /permission-denied/);
  assert.equal(JSON.parse(cache.get('micasa_guesthouses_v7'))[0].isSuspended, true, 'failed writes do not change cache');
  writeError = false;
  await api.suspendGuesthouse('legacy', false);
  assert.equal(written.isSuspended, false);
  await api.updateGuesthouse('hidden', { name: 'Edited', isSuspended: false });
  assert.equal('isSuspended' in written, false, 'editing cannot overwrite suspension');
  assert.equal('status' in written, false, 'editing cannot overwrite legacy visibility');

  const mobile = load('../../mobile/src/services/guesthouses.ts');
  assert.equal((await mobile.listGuesthouses()).map((g) => g.id).join(','), 'legacy,reactivated');
  assert.equal(await mobile.getGuesthouse('hidden'), null, 'direct links hide suspended properties');
  let visible;
  mobile.watchGuesthouses((items) => { visible = items; }, assert.fail);
  snapshotListener({ docs: records });
  assert.equal(visible.length, 2);
  snapshotListener({ docs: [records[1]] });
  assert.equal(visible.length, 0, 'live changes remove suspended properties');
  mobile.watchGuesthouse('hidden', (item) => { visible = item; }, assert.fail);
  snapshotListener({ id: 'hidden', exists: () => true, data: records[1].data });
  assert.equal(visible, null, 'open detail pages receive suspension');
  console.log('Suspension service checks passed.');
})().catch((error) => { console.error(error); process.exitCode = 1; });

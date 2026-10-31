// Runs the real routes, functions and models against the fake database.
//   npm test
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { install } = require('./fakeFirebase');

const db = install(); // must happen before the app is loaded
const app = require('../server/app');
const stats = require('../server/functions/stats');

let server;
let base;
before(async () => {
  server = app.listen(0);
  base = `http://localhost:${server.address().port}/api`;
});
after(() => server.close());

// Small helper: call the API, return { status, body }.
async function call(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

const SUPER = 'tok-super', ADMIN = 'tok-admin', MOD = 'tok-mod', CUSTOMER = 'tok-customer';
const house = (extra = {}) => ({
  name: 'Test House', description: 'Nice', city: 'Gaborone', country: 'Botswana',
  contactDetails: '+267 1', pricePerNight: 500, latitude: -24.6, longitude: 25.9, ...extra,
});

test('health check is public', async () => {
  const r = await call('GET', '/health');
  assert.equal(r.status, 200);
  assert.equal(r.body.data.status, 'ok');
});

test('writing needs a login, and the right role', async () => {
  assert.equal((await call('POST', '/guesthouses', { body: house() })).status, 401);
  assert.equal((await call('POST', '/guesthouses', { token: CUSTOMER, body: house() })).status, 403);
  assert.equal((await call('POST', '/guesthouses', { token: MOD, body: house() })).status, 403);
});

test('admin creates a guesthouse with zero ratings and createdBy', async () => {
  const r = await call('POST', '/guesthouses', { token: ADMIN, body: house({ amenities: 'Wifi, Pool' }) });
  assert.equal(r.status, 201);
  assert.deepEqual(r.body.data.amenities, ['Wifi', 'Pool']);
  assert.equal(r.body.data.ratingCount, 0);
  assert.equal(r.body.data.createdBy, 'u-admin');
});

test('validation rejects missing and bad values', async () => {
  const missing = await call('POST', '/guesthouses', { token: ADMIN, body: { name: 'Only a name' } });
  assert.equal(missing.status, 400);
  assert.match(missing.body.message, /Missing required fields/);

  const badLat = await call('POST', '/guesthouses', { token: ADMIN, body: house({ latitude: 200 }) });
  assert.equal(badLat.status, 400);
});

test('update cannot change rating totals', async () => {
  const created = await call('POST', '/guesthouses', { token: ADMIN, body: house() });
  const id = created.body.data.id;
  const r = await call('PUT', `/guesthouses/${id}`, { token: ADMIN, body: { name: 'Renamed', ratingSum: 999, averageRating: 5 } });
  assert.equal(r.body.data.name, 'Renamed');
  assert.equal(r.body.data.ratingSum, 0);
  assert.equal(r.body.data.averageRating, 0);
});

test('guesthouses are readable without login, unknown id is 404', async () => {
  assert.equal((await call('GET', '/guesthouses')).status, 200);
  assert.equal((await call('GET', '/guesthouses/nope')).status, 404);
});

test('moderator suspends a review and the guesthouse totals are corrected', async () => {
  db.data.guesthouses.g1 = { name: 'G1', city: 'Maun', pricePerNight: 100, ratingSum: 9, ratingCount: 2, averageRating: 4.5 };
  db.data.ratings = db.data.ratings || {};
  db.data.ratings.g1_a = { guesthouseId: 'g1', customerId: 'a', score: 5 };
  db.data.ratings.g1_b = { guesthouseId: 'g1', customerId: 'b', score: 4 };

  const totals = () => {
    const g = db.data.guesthouses.g1;
    return [g.ratingSum, g.ratingCount, g.averageRating];
  };

  const r = await call('DELETE', '/reviews/g1_a', { token: MOD });
  assert.equal(r.status, 200);
  assert.deepEqual(totals(), [4, 1, 4]);
  assert.equal(db.data.ratings.g1_a.status, 'suspended'); // still there, just hidden

  // suspending twice must not take the score out twice
  await call('DELETE', '/reviews/g1_a', { token: MOD });
  assert.deepEqual(totals(), [4, 1, 4]);

  await call('POST', '/reviews/g1_a/restore', { token: MOD });
  assert.deepEqual(totals(), [9, 2, 4.5]);
  assert.equal(db.data.ratings.g1_a.status, 'active');

  assert.equal((await call('DELETE', '/reviews/missing', { token: MOD })).status, 404);
});

test('suspending a guesthouse hides it from customers but keeps the data', async () => {
  const r = await call('DELETE', '/guesthouses/g1', { token: ADMIN });
  assert.equal(r.status, 200);
  assert.equal(db.data.guesthouses.g1.status, 'suspended');
  assert.ok(db.data.ratings.g1_b); // ratings are untouched

  const list = await call('GET', '/guesthouses');
  assert.ok(!list.body.data.some((g) => g.id === 'g1'));
  assert.equal((await call('GET', '/guesthouses/g1')).status, 404);

  const suspended = await call('GET', '/guesthouses/suspended', { token: ADMIN });
  assert.ok(suspended.body.data.some((g) => g.id === 'g1'));
  assert.equal((await call('GET', '/guesthouses/suspended')).status, 401);

  const back = await call('POST', '/guesthouses/g1/restore', { token: ADMIN });
  assert.equal(back.status, 200);
  assert.equal((await call('GET', '/guesthouses/g1')).status, 200);
});

test('dashboard numbers', () => {
  const now = new Date('2026-10-29T12:00:00Z');
  const result = stats.compute([
    { id: 'a', name: 'A', city: 'Gaborone', pricePerNight: 600, ratingCount: 3, averageRating: 4.0, createdAt: '2026-10-02T00:00:00Z' },
    { id: 'b', name: 'B', city: 'Gaborone', pricePerNight: 800, ratingCount: 5, averageRating: 4.8, createdAt: '2026-08-02T00:00:00Z' },
    { id: 'c', name: 'C', city: 'Maun', pricePerNight: 500, ratingCount: 0, averageRating: 0, createdAt: '2026-10-20T00:00:00Z' },
  ], now);
  assert.equal(result.totalGuesthouses, 3);
  assert.deepEqual(result.topCity, { city: 'Gaborone', count: 2 });
  assert.equal(result.highestRated.id, 'b');
  assert.equal(result.addedThisMonth, 2);
  assert.deepEqual(result.averagePriceByCity, { Gaborone: 700, Maun: 500 });
});

test('dashboard route is for staff only', async () => {
  assert.equal((await call('GET', '/dashboard', { token: CUSTOMER })).status, 403);
  assert.equal((await call('GET', '/dashboard', { token: MOD })).status, 200);
});

test('only the super admin manages staff', async () => {
  const body = { name: 'New Mod', email: 'newmod@x.com', password: 'secret1', role: 'moderator' };
  assert.equal((await call('POST', '/admins', { token: ADMIN, body })).status, 403);

  const created = await call('POST', '/admins', { token: SUPER, body });
  assert.equal(created.status, 201);
  assert.equal(db.data.admins[created.body.data.id].role, 'moderator');

  assert.equal((await call('POST', '/admins', { token: SUPER, body })).status, 409); // same email again
  assert.equal((await call('POST', '/admins', { token: SUPER, body: { ...body, email: 'z@x.com', role: 'king' } })).status, 400);
});

test('staff suspension: not yourself, 404 when unknown, record is kept', async () => {
  assert.equal((await call('DELETE', '/admins/u-super', { token: SUPER })).status, 400);
  assert.equal((await call('DELETE', '/admins/ghost', { token: SUPER })).status, 404);
  assert.equal((await call('DELETE', '/admins/u-mod', { token: SUPER })).status, 200);
  assert.equal(db.data.admins['u-mod'].status, 'suspended');

  // a suspended moderator can't use the API any more
  assert.equal((await call('GET', '/dashboard', { token: MOD })).status, 403);

  assert.equal((await call('POST', '/admins/u-mod/restore', { token: SUPER })).status, 200);
  assert.equal((await call('GET', '/dashboard', { token: MOD })).status, 200);
});

test('/auth/verify returns the role', async () => {
  const r = await call('POST', '/auth/verify', { token: ADMIN });
  assert.equal(r.body.data.role, 'admin');
  assert.equal((await call('POST', '/auth/verify', { token: CUSTOMER })).status, 403);
});

test('bad JSON gets a 400, unknown route a 404', async () => {
  const bad = await fetch(`${base}/guesthouses`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ADMIN}` }, body: '{oops' });
  assert.equal(bad.status, 400);
  assert.equal((await call('GET', '/nothing')).status, 404);
});

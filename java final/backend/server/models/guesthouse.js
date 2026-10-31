// MODEL: what a guesthouse looks like and how incoming data is checked.
// Collection: guesthouses/{id}. The mobile app reads these exact field names.
//
// To add a new field: put its name in the right list below (and in docs/DATABASE.md).
const { db } = require('../config/firebase');
const { fail } = require('../errors');

const TEXT = ['name', 'description', 'city', 'country', 'contactDetails', 'logoUrl'];
const NUMBERS = ['pricePerNight', 'latitude', 'longitude'];
const LISTS = ['amenities', 'galleryUrls'];
const REQUIRED = ['name', 'description', 'city', 'country', 'contactDetails', 'pricePerNight', 'latitude', 'longitude'];

const collection = () => db.collection('guesthouses');

// "Wifi, Parking" or ["Wifi", "Parking"] both become ["Wifi", "Parking"].
const toList = (v) =>
  Array.isArray(v) ? v.map(String).map((s) => s.trim()).filter(Boolean)
    : String(v).split(',').map((s) => s.trim()).filter(Boolean);

// Keeps ONLY the known fields and fixes their types.
// Anything else in the request (ratingSum, createdBy, ...) is dropped, so clients cannot set it.
function clean(input = {}) {
  const out = {};
  for (const f of TEXT) if (input[f] !== undefined) out[f] = String(input[f]).trim();
  for (const f of LISTS) if (input[f] !== undefined) out[f] = toList(input[f]);
  for (const f of NUMBERS) {
    if (input[f] === undefined) continue;
    const n = Number(input[f]);
    if (input[f] === '' || !Number.isFinite(n)) fail(400, `${f} must be a number`);
    out[f] = n;
  }
  if (out.pricePerNight < 0) fail(400, 'pricePerNight cannot be negative');
  if (out.latitude < -90 || out.latitude > 90) fail(400, 'latitude must be between -90 and 90');
  if (out.longitude < -180 || out.longitude > 180) fail(400, 'longitude must be between -180 and 180');
  return out;
}

// Used when creating: every required field must be present and not empty.
function requireFields(data) {
  const missing = REQUIRED.filter((f) => data[f] === undefined || data[f] === '');
  if (missing.length) fail(400, `Missing required fields: ${missing.join(', ')}`);
}

module.exports = { collection, clean, requireFields };

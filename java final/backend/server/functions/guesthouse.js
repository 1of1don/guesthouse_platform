// FUNCTIONS: guesthouse business logic. Routes call these, these call the model.
// Each function returns a Promise and throws fail(status, message) when something is wrong.
const { FieldValue } = require('../config/firebase');
const guesthouse = require('../models/guesthouse');
const plain = require('../models/plain');
const { fail } = require('../errors');

// A missing status means active, so older documents keep working.
const isSuspended = (g) => g.status === 'suspended';

// Customers only ever see active guesthouses.
async function list() {
  const snap = await guesthouse.collection().get();
  return snap.docs.map(plain).filter((g) => !isSuspended(g));
}

// For the admin portal, so staff can find what they suspended and bring it back.
async function listSuspended() {
  const snap = await guesthouse.collection().get();
  return snap.docs.map(plain).filter(isSuspended);
}

async function get(id) {
  const snap = await guesthouse.collection().doc(id).get();
  if (!snap.exists || isSuspended(plain(snap))) fail(404, 'Guesthouse not found');
  return plain(snap);
}

// "uid" is the staff member creating it. New guesthouses always start with zero ratings.
async function create(body, uid) {
  const data = guesthouse.clean(body);
  guesthouse.requireFields(data);

  const ref = guesthouse.collection().doc();
  await ref.set({
    amenities: [],
    galleryUrls: [],
    logoUrl: '',
    ...data,
    ratingSum: 0,
    ratingCount: 0,
    averageRating: 0,
    status: 'active',
    createdBy: uid,
    createdAt: FieldValue.serverTimestamp(),
  });
  return get(ref.id);
}

// Only fields from guesthouse.clean() can change. Rating totals can never be edited here.
async function update(id, body) {
  const data = guesthouse.clean(body);
  if (!Object.keys(data).length) fail(400, 'Nothing to update');

  const ref = guesthouse.collection().doc(id);
  if (!(await ref.get()).exists) fail(404, 'Guesthouse not found');
  await ref.update({ ...data, updatedAt: FieldValue.serverTimestamp() });
  return get(id);
}

// Nothing is deleted. The guesthouse and its ratings stay in the database, it just stops showing up
// for customers. The rating totals are left as they are so restoring it brings everything back.
async function remove(id) {
  const ref = guesthouse.collection().doc(id);
  if (!(await ref.get()).exists) fail(404, 'Guesthouse not found');

  await ref.update({ status: 'suspended', suspendedAt: FieldValue.serverTimestamp() });
  return { id };
}

async function restore(id) {
  const ref = guesthouse.collection().doc(id);
  if (!(await ref.get()).exists) fail(404, 'Guesthouse not found');

  await ref.update({ status: 'active', suspendedAt: null });
  return get(id);
}

module.exports = { list, listSuspended, get, create, update, remove, restore };

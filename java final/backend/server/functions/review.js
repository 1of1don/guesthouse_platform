// FUNCTIONS: review moderation. Customers write reviews in the mobile app; staff can list, suspend and restore them.
const { db, FieldValue } = require('../config/firebase');
const guesthouse = require('../models/guesthouse');
const review = require('../models/review');
const plain = require('../models/plain');
const { fail } = require('../errors');

// Newest first. Pass a guesthouseId to see one guesthouse's reviews, otherwise the latest 100.
// Suspended reviews are included (they carry status: 'suspended') so staff can restore them.
async function list(guesthouseId) {
  const query = guesthouseId ? review.collection().where('guesthouseId', '==', guesthouseId) : review.collection();
  const snap = await query.get();
  const all = snap.docs.map(plain);
  all.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return all.slice(0, 100);
}

// Moves a review in or out of the guesthouse totals, in one transaction so the average stays right.
// direction is +1 when the review comes back and -1 when it is suspended.
async function setStatus(id, status) {
  await db.runTransaction(async (tx) => {
    const reviewRef = review.collection().doc(id);
    const reviewSnap = await tx.get(reviewRef);
    if (!reviewSnap.exists) fail(404, 'Review not found');

    const r = reviewSnap.data();
    const alreadyThere = (r.status || 'active') === status;

    // Firestore wants every read before any write.
    const guesthouseRef = guesthouse.collection().doc(r.guesthouseId);
    const guesthouseSnap = await tx.get(guesthouseRef);

    if (!alreadyThere && guesthouseSnap.exists) {
      const g = guesthouseSnap.data();
      const direction = status === 'active' ? 1 : -1;
      const sum = Math.max(0, (g.ratingSum || 0) + direction * r.score);
      const count = Math.max(0, (g.ratingCount || 0) + direction);
      tx.update(guesthouseRef, { ratingSum: sum, ratingCount: count, averageRating: count ? sum / count : 0 });
    }
    tx.update(reviewRef, {
      status,
      suspendedAt: status === 'suspended' ? FieldValue.serverTimestamp() : null,
    });
  });
  return { id };
}

const remove = (id) => setStatus(id, 'suspended');
const restore = (id) => setStatus(id, 'active');

module.exports = { list, remove, restore };

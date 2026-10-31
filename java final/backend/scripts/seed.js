// Fills Firestore with sample guesthouses and reviews so the apps have something to show.
//   npm run seed              adds or overwrites the sample data (fixed ids, so no duplicates)
//   npm run seed -- --reset   FIRST suspends every existing guesthouse and rating (nothing is deleted).
// Uses the Admin SDK, so it works whatever the Firestore security rules say.
require('dotenv').config();
const { Timestamp } = require('firebase-admin/firestore');
const { db } = require('../server/config/firebase');
const { guesthouses, reviewers } = require('./sampleData');

const photo = (name) => `https://picsum.photos/seed/${name}/900/600`; // placeholder images
const daysAgo = (n) => Timestamp.fromMillis(Date.now() - n * 86400000);

async function suspendAll(name) {
  const snap = await db.collection(name).get();
  await Promise.all(snap.docs.map((d) => d.ref.update({ status: 'suspended' })));
  console.log(`suspended ${snap.size} in ${name}`);
}

async function main() {
  if (process.argv.includes('--reset')) {
    await suspendAll('ratings');
    await suspendAll('guesthouses');
  }

  for (const g of guesthouses) {
    const sum = g.reviews.reduce((total, r) => total + r[0], 0);
    const count = g.reviews.length;

    await db.collection('guesthouses').doc(g.id).set({
      name: g.name, description: g.description, city: g.city, country: g.country,
      contactDetails: g.phone, pricePerNight: g.pricePerNight,
      latitude: g.latitude, longitude: g.longitude, amenities: g.amenities,
      logoUrl: photo(`${g.id}-logo`),
      galleryUrls: Array.from({ length: g.photos }, (_, i) => photo(`${g.id}-${i + 1}`)),
      ratingSum: sum, ratingCount: count, averageRating: count ? sum / count : 0,
      status: 'active', createdBy: 'seed', createdAt: daysAgo(g.added),
    });

    for (const [score, who, comment, ago] of g.reviews) {
      const customerId = `seed_${who}`;
      await db.collection('ratings').doc(`${g.id}_${customerId}`).set({
        guesthouseId: g.id, customerId, customerName: reviewers[who],
        score, comment, status: 'active', createdAt: daysAgo(ago),
      });
    }
    console.log('wrote', g.id);
  }
  console.log(`Done. ${guesthouses.length} guesthouses written.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });

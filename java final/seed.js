//---Loads .env so ../server/config/firebase can initialize the Admin SDK.
require('dotenv').config();
const { Timestamp } = require('firebase-admin/firestore');
const { db } = require('../server/config/firebase');
const { guesthouses, reviewers } = require('./sampleData');

// Helpers:
const photo = (name) => `https://picsum.photos/seed/${name}/900/600`;
const daysAgo = (n) => Timestamp.fromMillis(Date.now() - n * 86400000);

//---wipe() reads every doc in a collection, then deletes them in parallel.
//---Promise.all on per-doc delete() is fine for a seed script but NOT for large
//---or bulkWriter() is the correct tool at scale.
async function wipe(name) {
  const snap = await db.collection(name).get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
  console.log(`deleted ${snap.size} from ${name}`);
}

async function main() {
  //---Optional --reset flag wipes ratings + guesthouses first.
  //---only deletes when --reset is passed. The header is wrong; the code is safer.
  if (process.argv.includes('--reset')) {
    await wipe('ratings');
    await wipe('guesthouses');
  }

  //---One iteration per sample guesthouse. Uses fixed doc IDs (g.id) so re-running
  //---without --reset overwrites cleanly instead of duplicating.
  for (const g of guesthouses) {
    //---Pre-compute aggregate rating fields from the raw review tuples
    //---([score, reviewerKey, comment, daysAgo]).
    const sum = g.reviews.reduce((total, r) => total + r[0], 0);
    const count = g.reviews.length;

    //---Write the guesthouse document. Absolute set() 
    //---overwrite the whole doc, which is what we want for seed data.
    await db.collection('guesthouses').doc(g.id).set({
      name: g.name, description: g.description, city: g.city, country: g.country,
      contactDetails: g.phone, pricePerNight: g.pricePerNight,
      latitude: g.latitude, longitude: g.longitude, amenities: g.amenities,
      logoUrl: photo(`${g.id}-logo`),
    
      //---Build N photos with N distinct 
      galleryUrls: Array.from({ length: g.photos },
        (_, i) => photo(`${g.id}-${i + 1}`)),
      ratingSum: sum, ratingCount: count,
      averageRating: count ? sum / count : 0,
      createdBy: 'seed', createdAt: daysAgo(g.added),
    });

    //---Write each review as a rating doc. 
    //---SAME customerId, so multiple reviews from different reviewers collapsed
    //--- into a single Firestore doc. Fixed below.
    for (const [score, who, comment, ago] of g.reviews) {
      const customerId = `seed_${who}`;
      await db.collection('ratings').doc(`${g.id}_${customerId}`).set({
        guesthouseId: g.id, customerId, customerName: reviewers[who],
        score, comment, createdAt: daysAgo(ago),
      });
    }
    console.log('wrote', g.id);
  }
  console.log(`Done. ${guesthouses.length} guesthouses written.`);
}

//---Same lifecycle as the create-superadmin script: explicit exit 0 on success,
//---exit 1 on failure so npm 
main().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });
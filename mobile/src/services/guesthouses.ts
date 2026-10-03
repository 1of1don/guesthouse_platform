// Firestore implementation. Same exports as the old mock, so no screen changes.
import {
  collection, deleteDoc, doc, DocumentData, getDoc, getDocs, query, runTransaction,
  serverTimestamp, setDoc, where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Customer, Guesthouse, Review } from '../types';

const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
// Accepts an array or a comma-separated string, e.g. "Wifi, Parking, Pool".
const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
const millis = (v: any): number => v?.toMillis?.() ?? (Number(v) || 0);

// Tolerant mapping: location may be latitude/longitude, or a {lat,lng} / GeoPoint field.
function toGuesthouse(id: string, d: DocumentData): Guesthouse {
  const loc = d.location ?? {};
  const sum = num(d.ratingSum);
  const count = num(d.ratingCount);
  return {
    id,
    name: d.name ?? 'Unnamed guesthouse',
    logoUrl: d.logoUrl ?? '',
    galleryUrls: list(d.galleryUrls),
    description: d.description ?? '',
    amenities: list(d.amenities),
    pricePerNight: num(d.pricePerNight),
    city: d.city ?? '',
    country: d.country ?? '',
    latitude: num(d.latitude ?? loc.latitude ?? loc.lat),
    longitude: num(d.longitude ?? loc.longitude ?? loc.lng),
    contactDetails: d.contactDetails ?? '',
    ratingSum: sum,
    ratingCount: count,
    averageRating: num(d.averageRating, count ? sum / count : 0),
  };
}

export async function listGuesthouses(): Promise<Guesthouse[]> {
  const snap = await getDocs(collection(db, 'guesthouses'));
  return snap.docs.map((d) => toGuesthouse(d.id, d.data()));
}

export async function getGuesthouse(id: string): Promise<Guesthouse | null> {
  const snap = await getDoc(doc(db, 'guesthouses', id));
  return snap.exists() ? toGuesthouse(snap.id, snap.data()) : null;
}

const toReview = (id: string, d: DocumentData): Review => ({
  id,
  guesthouseId: d.guesthouseId,
  customerId: d.customerId,
  customerName: d.customerName ?? 'Guest',
  score: num(d.score),
  comment: d.comment ?? '',
  createdAt: millis(d.createdAt),
});

export async function getReviews(guesthouseId: string): Promise<Review[]> {
  const snap = await getDocs(query(collection(db, 'ratings'), where('guesthouseId', '==', guesthouseId)));
  // Sorted here so no Firestore composite index is needed.
  return snap.docs.map((d) => toReview(d.id, d.data())).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getMyReview(guesthouseId: string, customerId: string): Promise<Review | null> {
  const snap = await getDoc(doc(db, 'ratings', `${guesthouseId}_${customerId}`));
  return snap.exists() ? toReview(snap.id, snap.data()) : null;
}

// One review per customer per guesthouse. A transaction keeps the guesthouse's
// ratingSum / ratingCount / averageRating correct (the admin dashboard reads averageRating).
export async function submitReview(guesthouseId: string, customer: Customer, score: number, comment: string) {
  const ghRef = doc(db, 'guesthouses', guesthouseId);
  const rRef = doc(db, 'ratings', `${guesthouseId}_${customer.id}`);
  await runTransaction(db, async (tx) => {
    const [ghSnap, rSnap] = await Promise.all([tx.get(ghRef), tx.get(rRef)]);
    if (!ghSnap.exists()) throw new Error('Guesthouse not found.');
    const d = ghSnap.data();
    let sum = num(d.ratingSum);
    let count = num(d.ratingCount);
    if (rSnap.exists()) {
      sum += score - num(rSnap.data().score); // editing an existing review
    } else {
      sum += score;
      count += 1;
    }
    tx.set(rRef, {
      guesthouseId, customerId: customer.id, customerName: customer.name,
      score, comment, createdAt: serverTimestamp(),
    });
    tx.update(ghRef, { ratingSum: sum, ratingCount: count, averageRating: count ? sum / count : 0 });
  });
}

export async function getFavouriteIds(customerId: string): Promise<string[]> {
  const snap = await getDocs(collection(db, 'customers', customerId, 'favourites'));
  return snap.docs.map((d) => d.id);
}

// Returns true if the guesthouse is now a favourite.
export async function toggleFavourite(customerId: string, guesthouseId: string): Promise<boolean> {
  const ref = doc(db, 'customers', customerId, 'favourites', guesthouseId);
  if ((await getDoc(ref)).exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, { createdAt: serverTimestamp() });
  return true;
}

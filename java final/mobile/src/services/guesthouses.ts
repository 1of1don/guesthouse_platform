// All the Firestore reading and writing for guesthouses, reviews and favourites.
import {
  collection, deleteDoc, doc, DocumentData, getDoc, getDocs,
  query, runTransaction, serverTimestamp, setDoc, where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Customer, Guesthouse, Review } from '../types';

// Amenities might be saved as an array or as "Wifi, Parking, Pool". Handle both.
function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

// Turns a raw Firestore document into the shape the screens expect.
function toGuesthouse(id: string, d: DocumentData): Guesthouse {
  return {
    id,
    name: d.name ?? '',
    logoUrl: d.logoUrl ?? '',
    galleryUrls: toList(d.galleryUrls),
    description: d.description ?? '',
    amenities: toList(d.amenities),
    pricePerNight: Number(d.pricePerNight) || 0,
    city: d.city ?? '',
    country: d.country ?? '',
    // The pin might be two fields, or one "location" field. Cover both.
    latitude: Number(d.latitude ?? d.location?.latitude ?? d.location?.lat) || 0,
    longitude: Number(d.longitude ?? d.location?.longitude ?? d.location?.lng) || 0,
    contactDetails: d.contactDetails ?? '',
    ratingSum: Number(d.ratingSum) || 0,
    ratingCount: Number(d.ratingCount) || 0,
    averageRating: Number(d.averageRating) || 0,
  };
}

// Staff suspend things instead of deleting them. No status at all means active.
const isSuspended = (d: DocumentData) => d.status === 'suspended';

function toReview(id: string, d: DocumentData): Review {
  return {
    id,
    guesthouseId: d.guesthouseId,
    customerId: d.customerId,
    customerName: d.customerName ?? 'Guest',
    score: Number(d.score) || 0,
    comment: d.comment ?? '',
    createdAt: d.createdAt?.toMillis?.() ?? 0, // Firestore timestamp -> number
  };
}

export async function listGuesthouses(): Promise<Guesthouse[]> {
  const snapshot = await getDocs(collection(db, 'guesthouses'));
  return snapshot.docs.filter((d) => !isSuspended(d.data())).map((d) => toGuesthouse(d.id, d.data()));
}

export async function getGuesthouse(id: string): Promise<Guesthouse | null> {
  const snapshot = await getDoc(doc(db, 'guesthouses', id));
  if (!snapshot.exists() || isSuspended(snapshot.data())) return null;
  return toGuesthouse(snapshot.id, snapshot.data());
}

export async function getReviews(guesthouseId: string): Promise<Review[]> {
  const q = query(collection(db, 'ratings'), where('guesthouseId', '==', guesthouseId));
  const snapshot = await getDocs(q);
  // Newest first. Done here so Firestore doesn't ask us to create an index.
  return snapshot.docs
    .filter((d) => !isSuspended(d.data()))
    .map((d) => toReview(d.id, d.data()))
    .sort((a, b) => b.createdAt - a.createdAt);
}

// Used to pre-fill the form if this person already reviewed the place.
export async function getMyReview(guesthouseId: string, customerId: string): Promise<Review | null> {
  const snapshot = await getDoc(doc(db, 'ratings', `${guesthouseId}_${customerId}`));
  if (!snapshot.exists() || isSuspended(snapshot.data())) return null;
  return toReview(snapshot.id, snapshot.data());
}

// Saves a review AND updates the guesthouse's average in one go.
// The review id is "guesthouse_customer", so rating twice replaces the old one.
export async function submitReview(guesthouseId: string, customer: Customer, score: number, comment: string) {
  const guesthouseRef = doc(db, 'guesthouses', guesthouseId);
  const reviewRef = doc(db, 'ratings', `${guesthouseId}_${customer.id}`);

  // A transaction means two people rating at once can't mess up the totals.
  await runTransaction(db, async (tx) => {
    const guesthouse = await tx.get(guesthouseRef);
    const oldReview = await tx.get(reviewRef);
    if (!guesthouse.exists() || isSuspended(guesthouse.data())) throw new Error('This guesthouse is no longer listed.');
    // A moderator took the old review down, so it can't be edited back in.
    if (oldReview.exists() && isSuspended(oldReview.data())) throw new Error('Your earlier review was removed by a moderator.');

    let sum = Number(guesthouse.data().ratingSum) || 0;
    let count = Number(guesthouse.data().ratingCount) || 0;

    if (oldReview.exists()) {
      sum = sum - oldReview.data().score + score; // swap the old score for the new one
    } else {
      sum = sum + score;
      count = count + 1;
    }

    tx.set(reviewRef, {
      guesthouseId,
      customerId: customer.id,
      customerName: customer.name,
      score,
      comment,
      createdAt: serverTimestamp(),
    });
    // The admin dashboard reads averageRating for "highest rated".
    tx.update(guesthouseRef, { ratingSum: sum, ratingCount: count, averageRating: count ? sum / count : 0 });
  });
}

export async function getFavouriteIds(customerId: string): Promise<string[]> {
  const snapshot = await getDocs(collection(db, 'customers', customerId, 'favourites'));
  return snapshot.docs.map((d) => d.id);
}

// Adds the guesthouse to favourites, or removes it if it's already there.
// Returns true if it is a favourite afterwards.
export async function toggleFavourite(customerId: string, guesthouseId: string): Promise<boolean> {
  const ref = doc(db, 'customers', customerId, 'favourites', guesthouseId);
  const existing = await getDoc(ref);

  if (existing.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, { createdAt: serverTimestamp() });
  return true;
}

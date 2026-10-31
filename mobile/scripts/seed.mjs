// Adds 4 sample guesthouses to Firestore. Run once, while the database is in test mode:
//   node --env-file=.env scripts/seed.mjs      (needs Node 20.6 or newer)
import { initializeApp } from 'firebase/app';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
});
const db = getFirestore(app);
const img = (s) => `https://picsum.photos/seed/${s}/900/600`;

const data = [
  { id: 'riverside', name: 'Riverside Guesthouse', city: 'Gaborone', country: 'Botswana', pricePerNight: 650,
    description: 'A cozy riverside stay with garden views, walking distance to the CBD.',
    amenities: ['Wifi', 'Parking', 'Pool', 'Breakfast'], latitude: -24.6282, longitude: 25.9231,
    contactDetails: '+267 71 234 567', ratingSum: 0, ratingCount: 0, averageRating: 0,
    logoUrl: img('riverside-logo'), galleryUrls: [img('riverside1'), img('riverside2'), img('riverside3')] },
  { id: 'acacia', name: 'Acacia Lodge', city: 'Francistown', country: 'Botswana', pricePerNight: 480,
    description: 'Quiet lodge under old acacia trees, close to the airport and the city centre.',
    amenities: ['Wifi', 'Parking', 'Breakfast'], latitude: -21.1699, longitude: 27.5084,
    contactDetails: '+267 72 345 678', ratingSum: 0, ratingCount: 0, averageRating: 0,
    logoUrl: img('acacia-logo'), galleryUrls: [img('acacia1'), img('acacia2')] },
  { id: 'kalahari', name: 'Kalahari Rest Stop', city: 'Maun', country: 'Botswana', pricePerNight: 720,
    description: 'Base for Okavango Delta trips, with a shaded courtyard and a campfire area.',
    amenities: ['Wifi', 'Pool', 'Bar', 'Airport shuttle'], latitude: -19.9833, longitude: 23.4167,
    contactDetails: '+267 73 456 789', ratingSum: 0, ratingCount: 0, averageRating: 0,
    logoUrl: img('kalahari-logo'), galleryUrls: [img('kalahari1'), img('kalahari2'), img('kalahari3')] },
  { id: 'desertrose', name: 'Desert Rose Inn', city: 'Ghanzi', country: 'Botswana', pricePerNight: 390,
    description: 'Simple, clean rooms on the edge of town. Good stop on the Trans-Kalahari route.',
    amenities: ['Wifi', 'Parking'], latitude: -21.7, longitude: 21.65,
    contactDetails: '+267 74 567 890', ratingSum: 0, ratingCount: 0, averageRating: 0,
    logoUrl: img('rose-logo'), galleryUrls: [img('rose1')] },
];

for (const { id, ...fields } of data) {
  await setDoc(doc(db, 'guesthouses', id), { ...fields, createdAt: serverTimestamp() });
  console.log('Added', id);
}
process.exit(0);

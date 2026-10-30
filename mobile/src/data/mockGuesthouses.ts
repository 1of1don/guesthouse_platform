import { Guesthouse, Review } from '../types';

const img = (seed: string) => `https://picsum.photos/seed/${seed}/900/600`;

// Mock data from the Figma wireframes. Replaced by Firestore later.
export const seedGuesthouses: Guesthouse[] = [
  {
    id: 'riverside', name: 'Riverside Guesthouse', city: 'Gaborone', country: 'Botswana',
    logoUrl: img('riverside-logo'), galleryUrls: [img('riverside1'), img('riverside2'), img('riverside3')],
    description: 'A cozy riverside stay with garden views, walking distance to the CBD.',
    amenities: ['Wifi', 'Parking', 'Pool', 'Breakfast'], pricePerNight: 650,
    latitude: -24.6282, longitude: 25.9231, contactDetails: '+267 71 234 567',
    ratingSum: 49, ratingCount: 10, averageRating: 4.9,
  },
  {
    id: 'acacia', name: 'Acacia Lodge', city: 'Francistown', country: 'Botswana',
    logoUrl: img('acacia-logo'), galleryUrls: [img('acacia1'), img('acacia2')],
    description: 'Quiet lodge under old acacia trees, close to the airport and the city centre.',
    amenities: ['Wifi', 'Parking', 'Breakfast'], pricePerNight: 480,
    latitude: -21.1699, longitude: 27.5084, contactDetails: '+267 72 345 678',
    ratingSum: 23, ratingCount: 5, averageRating: 4.6,
  },
  {
    id: 'kalahari', name: 'Kalahari Rest Stop', city: 'Maun', country: 'Botswana',
    logoUrl: img('kalahari-logo'), galleryUrls: [img('kalahari1'), img('kalahari2'), img('kalahari3')],
    description: 'Base for Okavango Delta trips, with a shaded courtyard and a campfire area.',
    amenities: ['Wifi', 'Pool', 'Bar', 'Airport shuttle'], pricePerNight: 720,
    latitude: -19.9833, longitude: 23.4167, contactDetails: '+267 73 456 789',
    ratingSum: 27, ratingCount: 6, averageRating: 4.5,
  },
  {
    id: 'desertrose', name: 'Desert Rose Inn', city: 'Ghanzi', country: 'Botswana',
    logoUrl: img('rose-logo'), galleryUrls: [img('rose1')],
    description: 'Simple, clean rooms on the edge of town. Good stop on the Trans-Kalahari route.',
    amenities: ['Wifi', 'Parking'], pricePerNight: 390,
    latitude: -21.7, longitude: 21.65, contactDetails: '+267 74 567 890',
    ratingSum: 21, ratingCount: 5, averageRating: 4.2,
  },
];

export const seedReviews: Review[] = [
  { id: 'riverside_seed1', guesthouseId: 'riverside', customerId: 'seed1', customerName: 'Naledi M.', score: 5, comment: 'Quiet, spotless and the garden is lovely.', createdAt: Date.now() - 86400000 * 9 },
  { id: 'acacia_seed2', guesthouseId: 'acacia', customerId: 'seed2', customerName: 'Tumelo K.', score: 4, comment: 'Good value. Breakfast could be earlier.', createdAt: Date.now() - 86400000 * 20 },
];

// Field names must match what the web admin portal writes to Firestore.
export type Guesthouse = {
  id: string;
  name: string;
  logoUrl: string;
  galleryUrls: string[];
  description: string;
  amenities: string[];
  pricePerNight: number; // always stored in BWP
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  contactDetails: string;
  ratingSum: number;
  ratingCount: number;
  averageRating: number;
};

export type Review = {
  id: string; // `${guesthouseId}_${customerId}` -> one review per customer
  guesthouseId: string;
  customerId: string;
  customerName: string;
  score: number; // 1..5
  comment: string;
  createdAt: number;
};

export type Customer = { id: string; name: string; email: string };

export type SortKey = 'price_asc' | 'price_desc' | 'rating_desc' | 'rating_asc';

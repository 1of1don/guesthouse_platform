export interface Guesthouse {
  _id?: string;
  name: string;
  city: string;
  country: string;
  description: string;
  amenities: string[];
  contactDetails: string;
  coordinates: { lat: number; lng: number };
  pricePerNight: number;
  rating?: number;
  logo?: string;
  gallery?: string[];
  createdAt?: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin';
}

export interface DashboardStats {
  totalGuesthouses: number;
  topCity: { name: string; count: number };
  highestRated: { name: string; rating: number };
  addedThisMonth: number;
  recent: Guesthouse[];
}
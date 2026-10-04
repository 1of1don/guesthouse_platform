import type { AdminUser, Guesthouse } from '../types';

const mockGuesthouses: Guesthouse[] = [
  {
    _id: '1',
    name: 'Riverside Guesthouse',
    city: 'Gaborone',
    country: 'Botswana',
    description: 'A cozy riverside stay with garden views.',
    amenities: ['Wifi', 'Parking', 'Pool', 'Breakfast'],
    contactDetails: '+267 71 234 567',
    coordinates: { lat: -24.6282, lng: 25.9231 },
    pricePerNight: 650,
    rating: 4.9,
  },
  {
    _id: '2',
    name: 'Acacia Lodge',
    city: 'Francistown',
    country: 'Botswana',
    description: 'Modern lodge in the heart of Francistown.',
    amenities: ['Wifi', 'Parking'],
    contactDetails: '+267 71 111 222',
    coordinates: { lat: -21.167, lng: 27.51 },
    pricePerNight: 480,
    rating: 4.6,
  },
  {
    _id: '3',
    name: 'Kalahari Rest Stop',
    city: 'Maun',
    country: 'Botswana',
    description: 'Gateway to the Delta.',
    amenities: ['Wifi', 'Pool'],
    contactDetails: '+267 71 999 888',
    coordinates: { lat: -19.9833, lng: 23.4167 },
    pricePerNight: 720,
    rating: 4.5,
  },
];

const mockAdmins: AdminUser[] = [
  { _id: '1', name: 'Ontirets B.', email: 'ontirets@biust.ac.bw', role: 'Owner' },
  { _id: '2', name: 'Don K.', email: 'don@biust.ac.bw', role: 'Admin' },
  { _id: '3', name: 'Naledi M.', email: 'naledi@biust.ac.bw', role: 'Admin' },
];

export const api = {
  login: async (_email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 300));
    return { token: 'mock-token-123' };
  },

  signup: async (_data: { name: string; email: string; password: string }) => {
    await new Promise((r) => setTimeout(r, 300));
    return { success: true };
  },

  getDashboardStats: async () => {
    await new Promise((r) => setTimeout(r, 300));
    return {
      totalGuesthouses: mockGuesthouses.length,
      topCity: { name: 'Gaborone', count: 34 },
      highestRated: { name: 'Riverside Guesthouse', rating: 4.9 },
      addedThisMonth: 9,
      recent: mockGuesthouses,
    };
  },

  getGuesthouses: async () => mockGuesthouses,

  getGuesthouse: async (id: string) =>
    mockGuesthouses.find((g) => g._id === id) || mockGuesthouses[0],

  createGuesthouse: async (data: Partial<Guesthouse>) => {
    console.log('CREATE:', data);
    return { ...data, _id: Date.now().toString() };
  },

  updateGuesthouse: async (id: string, data: Partial<Guesthouse>) => {
    console.log('UPDATE', id, data);
    return data;
  },

  deleteGuesthouse: async (id: string) => {
    console.log('DELETE', id);
    return { success: true };
  },

  getAdmins: async () => mockAdmins,

  createAdmin: async (_data: { name: string; email: string; password: string }) => {
    return { success: true };
  },

  deleteAdmin: async (_id: string) => {
    return { success: true };
  },
};
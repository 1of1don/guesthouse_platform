

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytes,
  type StorageReference,
} from 'firebase/storage';
import { db, isFirebaseConfigured, storage } from '../firebase';
import type { AdminUser, DashboardStats, Guesthouse, CityPriceStat } from '../types';

// Helper type for image uploads from the Add/Edit form
type GuesthouseImages = {
  logo?: File | null;
  gallery?: File[];
};

// ------------------------------------------------------------------------------
// INITIAL GUESTHOUSE DATA
// Starts completely EMPTY! All guesthouse data comes strictly from when an administrator
// registers a property through the "Add Guesthouse" form page.
// ------------------------------------------------------------------------------
const INITIAL_GUESTHOUSES: Guesthouse[] = [];

// ------------------------------------------------------------------------------
// INITIAL ADMIN USER
// As requested, exactly ONE admin account starts here:
// Ontiretse Bagwasi with email onty@micasa.com and role Owner.
// Additional team members can be added during a demo showcase!
// ------------------------------------------------------------------------------
const INITIAL_ADMINS: AdminUser[] = [
  {
    _id: 'adm-1',
    name: 'Ontiretse Bagwasi',
    email: 'onty@micasa.com',
    role: 'Owner',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
];

// Browser LocalStorage keys (used for instant offline caching and demo persistence)
const STORAGE_KEYS = {
  GUESTHOUSES: 'micasa_guesthouses_v7',
  ADMINS: 'micasa_admins_v4',
};


// Reads data from LocalStorage; if nothing is saved yet, saves and returns 'initial'
function getLocalData<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return initial;
  }
}

// Saves updated data array back into LocalStorage
function setLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Storage write error:', err);
  }
}

// Safely converts any unknown value to a valid number
const numberOrZero = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

// Safely turns comma-separated text or arrays into a clean array of strings
const stringList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

// Converts raw Firestore document data into our typed Guesthouse object
function toGuesthouse(id: string, data: DocumentData): Guesthouse {
  const latitude = data.latitude ?? data.coordinates?.lat ?? -24.6282;
  const longitude = data.longitude ?? data.coordinates?.lng ?? 25.9231;
  const createdAt =
    data.createdAt?.toDate?.() ??
    (typeof data.createdAt === 'string'
      ? new Date(data.createdAt)
      : undefined);

  return {
    _id: id,
    name: data.name ?? 'Untitled Property',
    city: data.city ?? 'Gaborone',
    country: data.country ?? 'Botswana',
    description: data.description ?? '',
    amenities: stringList(data.amenities),
    contactDetails: data.contactDetails ?? '',
    coordinates: {
      lat: numberOrZero(latitude),
      lng: numberOrZero(longitude),
    },
    pricePerNight: numberOrZero(data.pricePerNight),
    rating: data.rating !== undefined ? numberOrZero(data.rating) : undefined,
    logo: data.logoUrl ?? data.logo ?? '',
    gallery: stringList(data.galleryUrls ?? data.gallery),
    createdAt: createdAt?.toISOString() || new Date().toISOString(),
  };
}

// Formats guesthouse fields before sending to Firestore
function guesthouseFields(data: Partial<Guesthouse>) {
  return {
    name: data.name ?? '',
    city: data.city ?? '',
    country: data.country ?? 'Botswana',
    description: data.description ?? '',
    amenities: data.amenities ?? [],
    contactDetails: data.contactDetails ?? '',
    latitude: data.coordinates?.lat ?? -24.6282,
    longitude: data.coordinates?.lng ?? 25.9231,
    pricePerNight: data.pricePerNight ?? 0,
  };
}

// Uploads a single image file to Firebase Storage
async function uploadImage(
  guesthouseId: string,
  category: 'logo' | 'gallery',
  file: File,
): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not configured. Configure Storage before uploading guesthouse photos.');
  }
  const imageRef = ref(
    storage,
    `guesthouses/${guesthouseId}/${category}/${crypto.randomUUID()}`,
  );
  const result = await uploadBytes(imageRef, file, {
    contentType: file.type,
  });
  return getDownloadURL(result.ref);
}

// Deletes uploaded images after the guesthouse document has been removed.
async function deleteStorageContents(directory: StorageReference) {
  if (!storage) return;
  const contents = await listAll(directory);
  await Promise.all([
    ...contents.items.map((item) => deleteObject(item)),
    ...contents.prefixes.map((prefix) => deleteStorageContents(prefix)),
  ]);
}

// Uploads both the logo and multiple gallery images
async function uploadImages(
  guesthouseId: string,
  images: GuesthouseImages,
  currentGallery: string[] = [],
) {
  const [logoUrl, uploadedGallery] = await Promise.all([
    images.logo
      ? uploadImage(guesthouseId, 'logo', images.logo)
      : Promise.resolve(undefined),
    Promise.all(
      (images.gallery ?? []).map((file) =>
        uploadImage(guesthouseId, 'gallery', file),
      ),
    ),
  ]);

  return {
    ...(logoUrl ? { logoUrl } : {}),
    galleryUrls: [...currentGallery, ...uploadedGallery],
  };
}


// PUBLIC API OBJECT (Imported and used by all pages)
export const api = {
  // Check if live Firebase is active
  isConfigured: () => isFirebaseConfigured,


  // Calculates total guesthouses, top destination city, highest rating,
  // average nightly price, and city breakdown.
  getDashboardStats: async (): Promise<DashboardStats> => {
    // Fetch all guesthouses first
    const guesthouses = await api.getGuesthouses();
    const cityMap = new Map<string, { count: number; priceTotal: number }>();
    let priceSum = 0;

    // Group guesthouses by city to calculate city statistics
    for (const gh of guesthouses) {
      const city = gh.city || 'Unknown';
      const existing = cityMap.get(city) || { count: 0, priceTotal: 0 };
      existing.count += 1;
      existing.priceTotal += gh.pricePerNight || 0;
      cityMap.set(city, existing);
      priceSum += gh.pricePerNight || 0;
    }

    // Build city distribution array sorted by highest count first
    const cityDistribution: CityPriceStat[] = [...cityMap.entries()]
      .map(([city, data]) => ({
        city,
        count: data.count,
        avgPrice: Math.round(data.priceTotal / data.count),
      }))
      .sort((a, b) => b.count - a.count);

    // Identify city with the most guesthouses
    const topCity = cityDistribution[0]
      ? { name: cityDistribution[0].city, count: cityDistribution[0].count }
      : { name: '—', count: 0 };

    // Highest rated: only check guesthouses with ratings greater than 0
    const ratedGuesthouses = guesthouses.filter((g) => (g.rating ?? 0) > 0);
    const highestRated = ratedGuesthouses.sort(
      (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
    )[0];

    // Count how many guesthouses were added in the current calendar month
    const now = new Date();
    const addedThisMonth = guesthouses.filter((gh) => {
      if (!gh.createdAt) return false;
      const createdAt = new Date(gh.createdAt);
      return (
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth()
      );
    }).length;

    // Return the calculated stats object
    return {
      totalGuesthouses: guesthouses.length,
      topCity,
      highestRated: highestRated
        ? { name: highestRated.name, rating: highestRated.rating ?? 0 }
        : { name: 'No ratings yet', rating: 0 },
      addedThisMonth,
      averagePrice: guesthouses.length ? Math.round(priceSum / guesthouses.length) : 0,
      cityDistribution,
      recent: [...guesthouses]
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
        .slice(0, 5),
    };
  },


  // Loads all guesthouses from Firebase Firestore, with LocalStorage fallback
 
  getGuesthouses: async (): Promise<Guesthouse[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'guesthouses'));
        if (!snapshot.empty) {
          const list = snapshot.docs.map((item) => toGuesthouse(item.id, item.data()));
          setLocalData(STORAGE_KEYS.GUESTHOUSES, list);
          return list;
        }
      } catch (err) {
        console.warn('Firestore fetch failed, using local cache:', err);
      }
    }
    // Return LocalStorage data (or INITIAL_GUESTHOUSES if first run)
    return getLocalData<Guesthouse[]>(STORAGE_KEYS.GUESTHOUSES, INITIAL_GUESTHOUSES);
  },

 
  // 3. GET SINGLE GUESTHOUSE BY ID
  // Used by the Edit page to load existing data for a guesthouse
 
  getGuesthouse: async (id: string): Promise<Guesthouse> => {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDoc(doc(db, 'guesthouses', id));
        if (snapshot.exists()) {
          return toGuesthouse(snapshot.id, snapshot.data());
        }
      } catch (err) {
        console.warn('Firestore getDoc failed, using local store:', err);
      }
    }
    const local = getLocalData<Guesthouse[]>(STORAGE_KEYS.GUESTHOUSES, INITIAL_GUESTHOUSES);
    const found = local.find((g) => g._id === id);
    if (!found) throw new Error(`Guesthouse "${id}" not found.`);
    return found;
  },

 
  // 4. CREATE NEW GUESTHOUSE
  // Adds a new guesthouse record with optional logo and gallery files
 
  createGuesthouse: async (
    data: Partial<Guesthouse>,
    images: GuesthouseImages = {},
  ): Promise<string> => {
    const newId = `gh-${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();

    if (isFirebaseConfigured && db) {
      const guesthouseRef = doc(collection(db, 'guesthouses'));
      const imageFields = await uploadImages(guesthouseRef.id, images);
      await setDoc(guesthouseRef, {
        ...guesthouseFields(data),
        ...imageFields,
        rating: 0,
        createdAt: serverTimestamp(),
      });
      return guesthouseRef.id;
    }

    if (images.logo || images.gallery?.length) {
      throw new Error('Guesthouse photos require a configured Firebase Storage connection.');
    }

    // LocalStorage fallback path
    const localList = getLocalData<Guesthouse[]>(STORAGE_KEYS.GUESTHOUSES, INITIAL_GUESTHOUSES);
    const fallbackLogo = images.logo
      ? URL.createObjectURL(images.logo)
      : (data.logo || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80');

    const fallbackGallery = [
      ...(data.gallery || []),
      ...(images.gallery || []).map((f) => URL.createObjectURL(f)),
    ];

    const newRecord: Guesthouse = {
      _id: newId,
      name: data.name || 'Untitled Guesthouse',
      city: data.city || 'Gaborone',
      country: data.country || 'Botswana',
      description: data.description || '',
      amenities: data.amenities || ['Wi-Fi', 'Air Conditioning'],
      contactDetails: data.contactDetails || '+267 390 0000',
      coordinates: data.coordinates || { lat: -24.6282, lng: 25.9231 },
      pricePerNight: data.pricePerNight || 850,
      logo: fallbackLogo,
      gallery: fallbackGallery.length ? fallbackGallery : ['https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'],
      createdAt: nowIso,
    };

    setLocalData(STORAGE_KEYS.GUESTHOUSES, [newRecord, ...localList]);
    return newId;
  },

 
  // 5. UPDATE EXISTING GUESTHOUSE
  // Saves edits made on the Edit page back to the database
 
  updateGuesthouse: async (
    id: string,
    data: Partial<Guesthouse>,
    images: GuesthouseImages = {},
  ): Promise<void> => {
    if (isFirebaseConfigured && db) {
      const guesthouseRef = doc(db, 'guesthouses', id);
      const existingDoc = await getDoc(guesthouseRef);
      if (!existingDoc.exists()) {
        throw new Error(`Guesthouse "${id}" was not found in Firestore.`);
      }

      const current = toGuesthouse(existingDoc.id, existingDoc.data());
      const imageFields = await uploadImages(
        id,
        images,
        current.gallery ?? [],
      );
      await updateDoc(guesthouseRef, {
        ...guesthouseFields(data),
        ...imageFields,
      });
      return;
    }

    if (images.logo || images.gallery?.length) {
      throw new Error('Guesthouse photos require a configured Firebase Storage connection.');
    }

    // LocalStorage fallback
    const list = getLocalData<Guesthouse[]>(STORAGE_KEYS.GUESTHOUSES, INITIAL_GUESTHOUSES);
    const updated = list.map((item) => {
      if (item._id === id) {
        const logo = images.logo ? URL.createObjectURL(images.logo) : (data.logo || item.logo);
        const addedGallery = (images.gallery || []).map((f) => URL.createObjectURL(f));
        return {
          ...item,
          ...data,
          logo,
          gallery: [...(item.gallery || []), ...addedGallery],
        };
      }
      return item;
    });
    setLocalData(STORAGE_KEYS.GUESTHOUSES, updated);
  },

 
  // 6. DELETE GUESTHOUSE
  // Deletes the guesthouse record immediately and cleans up photos afterward.
 
  deleteGuesthouse: async (id: string): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'guesthouses', id));

      if (storage) {
        void deleteStorageContents(ref(storage, `guesthouses/${id}`)).catch((err) => {
          console.error(`Unable to delete photos for guesthouse "${id}":`, err);
        });
      }
    }

    // Remove from LocalStorage
    const list = getLocalData<Guesthouse[]>(STORAGE_KEYS.GUESTHOUSES, INITIAL_GUESTHOUSES);
    setLocalData(
      STORAGE_KEYS.GUESTHOUSES,
      list.filter((g) => g._id !== id),
    );
  },

 
  // Returns all registered administrators (Ontiretse Bagwasi + any created in demo)
 
  getAdmins: async (): Promise<AdminUser[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'admins'));
        if (!snapshot.empty) {
          const list: AdminUser[] = snapshot.docs.map((item) => {
            const data = item.data();
            return {
              _id: item.id,
              name: data.name ?? 'Admin',
              email: data.email ?? '',
              role: data.role === 'owner' || data.role === 'Owner' ? 'Owner' : 'Admin',
              status: 'Active',
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            };
          });
          setLocalData(STORAGE_KEYS.ADMINS, list);
          return list;
        }
      } catch (err) {
        console.warn('Firestore getAdmins failed, returning local:', err);
      }
    }
    return getLocalData<AdminUser[]>(STORAGE_KEYS.ADMINS, INITIAL_ADMINS);
  },

 
  // Adds a new administrator during a live demo presentation
 
  createAdmin: async (admin: Omit<AdminUser, '_id'>): Promise<AdminUser> => {
    const newAdmin: AdminUser = {
      _id: `adm-${Date.now().toString(36)}`,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'admins', newAdmin._id), {
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore admin save failed, stored locally:', err);
      }
    }
    const current = getLocalData<AdminUser[]>(STORAGE_KEYS.ADMINS, INITIAL_ADMINS);
    setLocalData(STORAGE_KEYS.ADMINS, [newAdmin, ...current]);
    return newAdmin;
  },

  // REGULAR USER MANAGEMENT

  // Fetches all standard users
  getRegularUsers: async (): Promise<any[]> => {
    if (isFirebaseConfigured && db) {
      try {
        // Assuming regular users are stored in a 'users' collection
        const snapshot = await getDocs(collection(db, 'users'));
        return snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
      } catch (err) {
        console.warn('Firestore getRegularUsers failed:', err);
      }
    }
    return []; // Return empty array if no DB or error
  },

  // Deletes a regular user
  deleteRegularUser: async (id: string): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'users', id));
    }
  },

 
  // Helper function to wipe browser cache and restore default guesthouses
 
  resetDemoData: () => {
    localStorage.removeItem(STORAGE_KEYS.GUESTHOUSES);
    localStorage.removeItem(STORAGE_KEYS.ADMINS);
  },
};

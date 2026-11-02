import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { app, db, isFirebaseConfigured } from '../firebase';
import type { AdminUser, CityPriceStat, Customer, DashboardStats, Guesthouse, Review } from '../types';

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

// The mobile app keeps ratingSum / ratingCount / averageRating up to date when
// a customer rates, so read those first. "rating" is from the early test data.
function ratingFrom(data: DocumentData): number | undefined {
  if (data.averageRating !== undefined) return numberOrZero(data.averageRating);
  const count = numberOrZero(data.ratingCount);
  if (count > 0) return numberOrZero(data.ratingSum) / count;
  return data.rating !== undefined ? numberOrZero(data.rating) : undefined;
}

// New rating totals for a guesthouse after a review is hidden, restored or deleted
function totalsAfter(data: DocumentData, scoreChange: number, countChange: number) {
  const ratingSum = Math.max(0, numberOrZero(data.ratingSum) + scoreChange);
  const ratingCount = Math.max(0, numberOrZero(data.ratingCount) + countChange);
  return { ratingSum, ratingCount, averageRating: ratingCount ? ratingSum / ratingCount : 0 };
}

// Converts raw Firestore document data into our typed Guesthouse object
function toGuesthouse(id: string, data: DocumentData): Guesthouse {
  const latitude = data.latitude ?? data.coordinates?.lat ?? -24.6282;
  const longitude = data.longitude ?? data.coordinates?.lng ?? 25.9231;
  // Old records only have status, newer ones have the isSuspended boolean.
  const suspended =
    typeof data.isSuspended === 'boolean' ? data.isSuspended : data.status === 'suspended';
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
    rating: ratingFrom(data),
    ratingCount: numberOrZero(data.ratingCount),
    logo: data.logoUrl ?? data.logo ?? '',
    gallery: stringList(data.galleryUrls ?? data.gallery),
    createdAt: createdAt?.toISOString() || new Date().toISOString(),
    isSuspended: suspended,
    status: suspended ? 'suspended' : 'active',
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
    isSuspended: data.isSuspended ?? (data.status === 'suspended'),
    status: (data.isSuspended ?? (data.status === 'suspended')) ? 'suspended' : 'active',
  };
}

// Cloudinary settings come from web/.env (see .env.example).
// An "unsigned" upload preset lets the browser upload without a secret key.
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

// Uploads one image to Cloudinary and returns its public web address.
async function uploadImage(
  guesthouseId: string,
  category: 'logo' | 'gallery',
  file: File,
): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Photo uploads are not set up. Add the Cloudinary values to web/.env and restart.');
  }
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  form.append('folder', `guesthouses/${guesthouseId}/${category}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form },
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.error?.message || 'Could not upload the photo.');
  }
  return result.secure_url as string;
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


// Works out the dashboard numbers from a list of guesthouses. Kept outside the
// api object so the dashboard can rerun it every time the live list changes.
export function buildDashboardStats(guesthouses: Guesthouse[]): DashboardStats {
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
  const highestRated = [...ratedGuesthouses].sort(
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
    suspendedCount: guesthouses.filter((gh) => gh.isSuspended).length,
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
}


// PUBLIC API OBJECT (Imported and used by all pages)
export const api = {
  // Check if live Firebase is active
  isConfigured: () => isFirebaseConfigured,


  // Calculates total guesthouses, top destination city, highest rating,
  // average nightly price, and city breakdown.
  getDashboardStats: async (): Promise<DashboardStats> =>
    buildDashboardStats(await api.getGuesthouses()),


  // Loads all guesthouses from Firebase Firestore, with LocalStorage fallback
 
  getGuesthouses: async (): Promise<Guesthouse[]> => {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, 'guesthouses'));
        // An empty collection is a real answer, don't fall back to old cached listings.
        const list = snapshot.docs.map((item) => toGuesthouse(item.id, item.data()));
        setLocalData(STORAGE_KEYS.GUESTHOUSES, list);
        return list;
      } catch (err) {
        console.warn('Firestore fetch failed, using local cache:', err);
      }
    }
    // Return LocalStorage data (or INITIAL_GUESTHOUSES if first run)
    return getLocalData<Guesthouse[]>(STORAGE_KEYS.GUESTHOUSES, INITIAL_GUESTHOUSES);
  },

 
  // Live version of getGuesthouses. Ratings from the mobile app and suspensions
  // made by other admins show up without a refresh. Returns the unsubscribe function.
  watchGuesthouses: (
    onChange: (items: Guesthouse[]) => void,
    onError: (error: Error) => void,
  ): (() => void) => {
    if (!isFirebaseConfigured || !db) {
      onChange(getLocalData<Guesthouse[]>(STORAGE_KEYS.GUESTHOUSES, INITIAL_GUESTHOUSES));
      return () => {};
    }
    return onSnapshot(
      collection(db, 'guesthouses'),
      (snapshot) => {
        const list = snapshot.docs.map((item) => toGuesthouse(item.id, item.data()));
        setLocalData(STORAGE_KEYS.GUESTHOUSES, list);
        onChange(list);
      },
      onError,
    );
  },


  // GET SINGLE GUESTHOUSE BY ID
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

 
  // CREATE NEW GUESTHOUSE
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
        ratingSum: 0,
        ratingCount: 0,
        averageRating: 0,
        createdAt: serverTimestamp(),
      });
      return guesthouseRef.id;
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
      isSuspended: data.isSuspended ?? (data.status === 'suspended'),
      status: (data.isSuspended ?? (data.status === 'suspended')) ? 'suspended' : 'active',
    };

    setLocalData(STORAGE_KEYS.GUESTHOUSES, [newRecord, ...localList]);
    return newId;
  },

 
  // UPDATE EXISTING GUESTHOUSE
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
      // Only the suspend action changes visibility, including during photo uploads.
      const { isSuspended: _isSuspended, status: _status, ...editableFields } = guesthouseFields(data);
      await updateDoc(guesthouseRef, {
        ...editableFields,
        ...imageFields,
      });
      return;
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
          isSuspended: item.isSuspended ?? (item.status === 'suspended'),
          status: (item.isSuspended ?? (item.status === 'suspended')) ? 'suspended' : 'active',
          logo,
          gallery: [...(item.gallery || []), ...addedGallery],
        };
      }
      return item;
    });
    setLocalData(STORAGE_KEYS.GUESTHOUSES, updated);
  },

 
  // DELETE GUESTHOUSE
  // Deletes the guesthouse record immediately and cleans up photos afterward.
 
  deleteGuesthouse: async (id: string): Promise<void> => {
    if (isFirebaseConfigured && db) {
      // Photos stay in Cloudinary. Deleting them needs the secret API key,
      // which must never be in the browser, so remove them from the Cloudinary console if needed.
      await deleteDoc(doc(db, 'guesthouses', id));
    }

    // Remove from LocalStorage
    const list = getLocalData<Guesthouse[]>(STORAGE_KEYS.GUESTHOUSES, INITIAL_GUESTHOUSES);
    setLocalData(
      STORAGE_KEYS.GUESTHOUSES,
      list.filter((g) => g._id !== id),
    );
  },

  // SUSPEND / ACTIVATE GUESTHOUSE
  // isSuspended = true hides the listing from the mobile app, false shows it again.
  // Nothing is deleted, so a listing can be reactivated at any time.
  suspendGuesthouse: async (id: string, suspend: boolean): Promise<void> => {
    const newStatus: 'active' | 'suspended' = suspend ? 'suspended' : 'active';

    // Update Firestore if configured
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'guesthouses', id), {
        isSuspended: suspend,
        status: newStatus,
      });
    }

    // Always update localStorage (keeps UI in sync even without Firebase)
    const list = getLocalData<Guesthouse[]>(STORAGE_KEYS.GUESTHOUSES, INITIAL_GUESTHOUSES);
    setLocalData(
      STORAGE_KEYS.GUESTHOUSES,
      list.map((g) => (g._id === id ? { ...g, isSuspended: suspend, status: newStatus } : g)),
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

 
  // Adds a new administrator WITH a real login (email + temporary password).
  // A second, temporary Firebase connection creates the account, so the admin
  // who is doing this stays logged in. Then admins/{new uid} gives them access.

  createAdmin: async (admin: Omit<AdminUser, '_id'>, password: string): Promise<AdminUser> => {
    if (isFirebaseConfigured && db && app) {
      if (password.length < 8) throw new Error('The temporary password must be at least 8 characters.');
      const helperApp = initializeApp(app.options, `create-admin-${Date.now()}`);
      try {
        const helperAuth = getAuth(helperApp);
        const cred = await createUserWithEmailAndPassword(helperAuth, admin.email.trim(), password);
        await signOut(helperAuth);
        await setDoc(doc(db, 'admins', cred.user.uid), {
          name: admin.name.trim(),
          email: admin.email.trim(),
          role: admin.role,
          createdAt: serverTimestamp(),
        });
        return { ...admin, _id: cred.user.uid, status: 'Active', createdAt: new Date().toISOString() };
      } catch (err) {
        const code = (err as { code?: string })?.code;
        if (code === 'auth/email-already-in-use') throw new Error('An account with this email already exists.');
        if (code === 'auth/invalid-email') throw new Error('That email address does not look right.');
        throw err;
      } finally {
        void deleteApp(helperApp);
      }
    }

    // No Firebase (local demo mode): keep the record in this browser only.
    const newAdmin: AdminUser = {
      _id: `adm-${Date.now().toString(36)}`,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    const current = getLocalData<AdminUser[]>(STORAGE_KEYS.ADMINS, INITIAL_ADMINS);
    setLocalData(STORAGE_KEYS.ADMINS, [newAdmin, ...current]);
    return newAdmin;
  },

 
  // CUSTOMERS (people who signed up on the mobile app)
  // The mobile app saves them in the "customers" collection using their login uid.

  getCustomers: async (): Promise<Customer[]> => {
    if (!isFirebaseConfigured || !db) return [];
    const snapshot = await getDocs(collection(db, 'customers'));
    return snapshot.docs.map((item) => {
      const data = item.data();
      return {
        _id: item.id,
        name: data.name ?? '',
        email: data.email ?? '',
        createdAt: data.createdAt?.toDate?.()?.toISOString(),
        isSuspended: data.isSuspended === true,
      };
    });
  },

  // A suspended customer can still browse on the mobile app but can't rate or
  // review (firestore.rules checks this too).
  setCustomerSuspended: async (id: string, suspend: boolean): Promise<void> => {
    if (!isFirebaseConfigured || !db) throw new Error('Firebase is not configured.');
    await updateDoc(doc(db, 'customers', id), {
      isSuspended: suspend,
      suspendedAt: suspend ? serverTimestamp() : null,
    });
  },

  // Only removes the profile document. The login itself still has to be
  // removed under Authentication in the Firebase console.
  deleteCustomer: async (id: string): Promise<void> => {
    if (!isFirebaseConfigured || !db) return;
    await deleteDoc(doc(db, 'customers', id));
  },

  // REVIEWS (ratings + comments from the mobile app)

  getReviews: async (): Promise<Review[]> => {
    if (!isFirebaseConfigured || !db) return [];
    const snapshot = await getDocs(collection(db, 'ratings'));
    return snapshot.docs
      .map((item) => {
        const data = item.data();
        return {
          _id: item.id,
          guesthouseId: data.guesthouseId ?? '',
          customerId: data.customerId ?? '',
          customerName: data.customerName ?? 'Guest',
          score: numberOrZero(data.score),
          comment: data.comment ?? '',
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          isHidden: data.isHidden === true,
        };
      })
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  },

  // Hiding a review takes it off the mobile app and out of the guesthouse average,
  // like a removed review on Airbnb. Restoring puts it back. Done in a transaction
  // so ratingSum / ratingCount stay correct.
  setReviewHidden: async (review: Review, hidden: boolean): Promise<void> => {
    if (!isFirebaseConfigured || !db) throw new Error('Firebase is not configured.');
    const firestore = db;
    await runTransaction(firestore, async (tx) => {
      const reviewRef = doc(firestore, 'ratings', review._id);
      const guesthouseRef = doc(firestore, 'guesthouses', review.guesthouseId);
      const [reviewSnap, guesthouseSnap] = await Promise.all([tx.get(reviewRef), tx.get(guesthouseRef)]);
      if (!reviewSnap.exists()) throw new Error('This review no longer exists.');
      const wasHidden = reviewSnap.data().isHidden === true;
      if (wasHidden === hidden) return;

      tx.update(reviewRef, { isHidden: hidden, hiddenAt: hidden ? serverTimestamp() : null });
      if (guesthouseSnap.exists()) {
        const score = numberOrZero(reviewSnap.data().score);
        const change = hidden ? -1 : 1;
        tx.update(guesthouseRef, totalsAfter(guesthouseSnap.data(), score * change, change));
      }
    });
  },

  deleteReview: async (review: Review): Promise<void> => {
    if (!isFirebaseConfigured || !db) throw new Error('Firebase is not configured.');
    const firestore = db;
    await runTransaction(firestore, async (tx) => {
      const reviewRef = doc(firestore, 'ratings', review._id);
      const guesthouseRef = doc(firestore, 'guesthouses', review.guesthouseId);
      const [reviewSnap, guesthouseSnap] = await Promise.all([tx.get(reviewRef), tx.get(guesthouseRef)]);
      if (!reviewSnap.exists()) return;
      tx.delete(reviewRef);
      // A hidden review was already taken out of the totals
      if (guesthouseSnap.exists() && reviewSnap.data().isHidden !== true) {
        tx.update(guesthouseRef, totalsAfter(guesthouseSnap.data(), -numberOrZero(reviewSnap.data().score), -1));
      }
    });
  },


  // Helper function to wipe browser cache and restore default guesthouses
 
  resetDemoData: () => {
    localStorage.removeItem(STORAGE_KEYS.GUESTHOUSES);
    localStorage.removeItem(STORAGE_KEYS.ADMINS);
  },
};

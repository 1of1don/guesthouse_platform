import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytes,
} from 'firebase/storage';
import type { StorageReference } from 'firebase/storage';
import type { AdminUser, DashboardStats, Guesthouse } from '../types';
import { db, storage } from '../firebase';

type GuesthouseImages = {
  logo?: File | null;
  gallery?: File[];
};

const numberOrZero = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const stringList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

function toGuesthouse(id: string, data: DocumentData): Guesthouse {
  const latitude = data.latitude ?? data.coordinates?.lat;
  const longitude = data.longitude ?? data.coordinates?.lng;
  const createdAt =
    data.createdAt?.toDate?.() ??
    (typeof data.createdAt === 'string'
      ? new Date(data.createdAt)
      : undefined);

  return {
    _id: id,
    name: data.name ?? '',
    city: data.city ?? '',
    country: data.country ?? '',
    description: data.description ?? '',
    amenities: stringList(data.amenities),
    contactDetails: data.contactDetails ?? '',
    coordinates: {
      lat: numberOrZero(latitude),
      lng: numberOrZero(longitude),
    },
    pricePerNight: numberOrZero(data.pricePerNight),
    rating: numberOrZero(data.averageRating ?? data.rating),
    logo: data.logoUrl ?? data.logo ?? '',
    gallery: stringList(data.galleryUrls ?? data.gallery),
    createdAt: createdAt?.toISOString(),
  };
}

function guesthouseFields(data: Partial<Guesthouse>) {
  return {
    name: data.name ?? '',
    city: data.city ?? '',
    country: data.country ?? '',
    description: data.description ?? '',
    amenities: data.amenities ?? [],
    contactDetails: data.contactDetails ?? '',
    latitude: data.coordinates?.lat ?? 0,
    longitude: data.coordinates?.lng ?? 0,
    pricePerNight: data.pricePerNight ?? 0,
  };
}

async function uploadImage(
  guesthouseId: string,
  category: 'logo' | 'gallery',
  file: File,
): Promise<string> {
  const imageRef = ref(
    storage,
    `guesthouses/${guesthouseId}/${category}/${crypto.randomUUID()}`,
  );
  const result = await uploadBytes(imageRef, file, {
    contentType: file.type,
  });
  return getDownloadURL(result.ref);
}

async function deleteStorageContents(directory: StorageReference) {
  const contents = await listAll(directory);
  await Promise.all([
    ...contents.items.map((item) => deleteObject(item)),
    ...contents.prefixes.map((prefix) => deleteStorageContents(prefix)),
  ]);
}

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

async function readGuesthouse(id: string): Promise<Guesthouse | null> {
  const snapshot = await getDoc(doc(db, 'guesthouses', id));
  return snapshot.exists() ? toGuesthouse(snapshot.id, snapshot.data()) : null;
}

export const api = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const guesthouses = await api.getGuesthouses();
    const cityCounts = new Map<string, number>();

    for (const guesthouse of guesthouses) {
      cityCounts.set(
        guesthouse.city,
        (cityCounts.get(guesthouse.city) ?? 0) + 1,
      );
    }

    const topCity = [...cityCounts.entries()].sort(
      ([cityA, countA], [cityB, countB]) =>
        countB - countA || cityA.localeCompare(cityB),
    )[0];
    const highestRated = [...guesthouses].sort(
      (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
    )[0];
    const now = new Date();
    const addedThisMonth = guesthouses.filter((guesthouse) => {
      if (!guesthouse.createdAt) return false;
      const createdAt = new Date(guesthouse.createdAt);
      return (
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth()
      );
    }).length;

    return {
      totalGuesthouses: guesthouses.length,
      topCity: topCity
        ? { name: topCity[0], count: topCity[1] }
        : { name: '—', count: 0 },
      highestRated: highestRated
        ? { name: highestRated.name, rating: highestRated.rating ?? 0 }
        : { name: '—', rating: 0 },
      addedThisMonth,
      recent: [...guesthouses]
        .sort((a, b) =>
          (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
        )
        .slice(0, 5),
    };
  },

  getGuesthouses: async (): Promise<Guesthouse[]> => {
    const snapshot = await getDocs(collection(db, 'guesthouses'));
    return snapshot.docs.map((item) => toGuesthouse(item.id, item.data()));
  },

  getGuesthouse: async (id: string): Promise<Guesthouse> => {
    const guesthouse = await readGuesthouse(id);
    if (!guesthouse) throw new Error('Guesthouse not found.');
    return guesthouse;
  },

  createGuesthouse: async (
    data: Partial<Guesthouse>,
    images: GuesthouseImages = {},
  ) => {
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
  },

  updateGuesthouse: async (
    id: string,
    data: Partial<Guesthouse>,
    images: GuesthouseImages = {},
  ) => {
    const guesthouse = await readGuesthouse(id);
    if (!guesthouse) throw new Error('Guesthouse not found.');

    const imageFields = await uploadImages(
      id,
      images,
      guesthouse.gallery ?? [],
    );
    await updateDoc(doc(db, 'guesthouses', id), {
      ...guesthouseFields(data),
      ...imageFields,
    });
  },

  deleteGuesthouse: async (id: string) => {
    await deleteStorageContents(ref(storage, `guesthouses/${id}`));
    await deleteDoc(doc(db, 'guesthouses', id));
  },

  getAdmins: async (): Promise<AdminUser[]> => {
    const snapshot = await getDocs(collection(db, 'admins'));
    return snapshot.docs.map((item) => {
      const data = item.data();
      return {
        _id: item.id,
        name: data.name ?? '',
        email: data.email ?? '',
        role: data.role === 'owner' || data.role === 'Owner' ? 'Owner' : 'Admin',
      };
    });
  },
};

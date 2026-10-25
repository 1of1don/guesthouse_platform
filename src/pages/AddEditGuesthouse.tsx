import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Sparkles,
  Camera,
  Check,
  Trash2,
  ExternalLink,
  Navigation,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import type { Guesthouse } from '../types';
import { useSettings } from '../context/SettingsContext';

// City presets for Botswana with accurate GPS coordinates
const CITY_PRESETS: Record<string, { lat: number; lng: number }> = {
  Gaborone: { lat: -24.6282, lng: 25.9231 },
  Kasane: { lat: -17.8178, lng: 25.1501 },
  Maun: { lat: -19.9833, lng: 23.4167 },
  Francistown: { lat: -21.1736, lng: 27.5125 },
  Palapye: { lat: -22.5461, lng: 27.1251 },
  Ghanzi: { lat: -21.6967, lng: 21.6467 },
};

const POPULAR_AMENITIES = [
  'Free Wi-Fi',
  'Swimming Pool',
  'Air Conditioning',
  'Solar Backup Power',
  'Breakfast Included',
  'Braai / BBQ Area',
  'Free Parking',
  'En-Suite Bathrooms',
  'Airport Shuttle',
  'Garden & Terrace',
  'Generator Backup',
  'Workspace',
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const isAcceptedImage = (file: File) =>
  ACCEPTED_IMAGE_TYPES.has(file.type) && file.size <= MAX_IMAGE_SIZE;

async function prepareImageForUpload(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    if (scale === 1 && file.size <= 750 * 1024) return file;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare the selected image for upload.');
    context.drawImage(bitmap, 0, 0, width, height);

    const compressed = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Could not compress the selected image.'));
        },
        'image/webp',
        0.82,
      );
    });

    if (compressed.size >= file.size && scale === 1) return file;
    const name = file.name.replace(/\.[^.]+$/, '') || 'guesthouse-image';
    const extension = compressed.type === 'image/webp' ? 'webp' : 'png';
    return new File([compressed], `${name}.${extension}`, {
      type: compressed.type,
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}

const emptyGuesthouse: Guesthouse = {
  name: '',
  city: 'Gaborone',
  country: 'Botswana',
  description: '',
  amenities: ['Free Wi-Fi', 'Breakfast Included', 'Free Parking', 'Air Conditioning'],
  contactDetails: '',
  coordinates: { lat: -24.6282, lng: 25.9231 },
  pricePerNight: 950,
  gallery: [],
  logo: '',
};

export default function AddEditGuesthouse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatPrice, currency } = useSettings();

  const [form, setForm] = useState<Guesthouse>(emptyGuesthouse);
  const [customAmenity, setCustomAmenity] = useState('');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoError, setLogoError] = useState('');
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryError, setGalleryError] = useState('');
  const [preparingImages, setPreparingImages] = useState(false);

  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getGuesthouse(id)
      .then((guesthouse) => {
        setForm(guesthouse);
        if (guesthouse.logo) setLogoPreview(guesthouse.logo);
        if (guesthouse.gallery) setGalleryPreviews(guesthouse.gallery);
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error ? cause.message : 'Unable to load guesthouse details.',
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCityChange = (cityName: string) => {
    const coords = CITY_PRESETS[cityName] || form.coordinates;
    setForm({
      ...form,
      city: cityName,
      coordinates: coords,
    });
  };

  const toggleAmenity = (item: string) => {
    setForm((prev) => {
      const exists = prev.amenities.includes(item);
      const updated = exists
        ? prev.amenities.filter((a) => a !== item)
        : [...prev.amenities, item];
      return { ...prev, amenities: updated };
    });
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !form.amenities.includes(trimmed)) {
      setForm((prev) => ({ ...prev, amenities: [...prev.amenities, trimmed] }));
      setCustomAmenity('');
    }
  };

  const handleLogoUpload = async (file: File | null) => {
    if (!file) return;
    if (!isAcceptedImage(file)) {
      setLogoError('Choose a PNG, JPG, or WEBP image no larger than 5MB.');
      return;
    }
    setLogoError('');
    setError('');
    setPreparingImages(true);
    try {
      const preparedFile = await prepareImageForUpload(file);
      setLogoFile(preparedFile);
      setLogoPreview(URL.createObjectURL(preparedFile));
    } catch (cause) {
      setLogoError(cause instanceof Error ? cause.message : 'Unable to prepare the cover image.');
    } finally {
      setPreparingImages(false);
    }
  };

  const handleGalleryUpload = async (files: File[]) => {
    if (!files.length) return;
    const invalidFile = files.find((file) => !isAcceptedImage(file));
    if (invalidFile) {
      setGalleryError('Choose PNG, JPG, or WEBP images no larger than 5MB each.');
      return;
    }
    setGalleryError('');
    setError('');
    setPreparingImages(true);
    try {
      const preparedFiles = await Promise.all(files.map(prepareImageForUpload));
      setGalleryFiles((previous) => [...previous, ...preparedFiles]);
      setGalleryPreviews((previous) => [
        ...previous,
        ...preparedFiles.map((file) => URL.createObjectURL(file)),
      ]);
    } catch (cause) {
      setGalleryError(cause instanceof Error ? cause.message : 'Unable to prepare gallery images.');
    } finally {
      setPreparingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (logoError || galleryError || preparingImages) return;
    setSaving(true);
    setError('');

    try {
      const images = { logo: logoFile, gallery: galleryFiles };
      if (id) {
        await api.updateGuesthouse(id, form, images);
      } else {
        await api.createGuesthouse(form, images);
      }
      setSuccessToast(true);
      setTimeout(() => {
        navigate('/guesthouses');
      }, 900);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to save guesthouse property.',
      );
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (confirm(`Permanently remove "${form.name}" from the platform?`)) {
      setSaving(true);
      try {
        await api.deleteGuesthouse(id);
        navigate('/guesthouses');
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : 'Unable to delete guesthouse.',
        );
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center animate-pulse">
        <div className="h-8 bg-black/[0.04] dark:bg-white/[0.05] rounded-xl w-48 mx-auto mb-4" />
        <div className="h-96 bg-black/[0.03] dark:bg-white/[0.04] rounded-3xl max-w-2xl mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Action */}
      <div className="flex items-center justify-between">
        <Link
          to="/guesthouses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A6C60] hover:text-[#231A14] dark:text-[#A69788] dark:hover:text-[#F7F4EF] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Guesthouses</span>
        </Link>

        {id && (
          <span className="text-xs font-mono text-[#8F7F70] dark:text-[#9E8E80]">
            ID: {id}
          </span>
        )}
      </div>

      {/* Main Header */}
      <div className="pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#231A14] dark:text-[#F7F4EF]">
          {id ? `Edit "${form.name || 'Guesthouse'}"` : 'Register New Guesthouse'}
        </h1>
        <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-0.5">
          Provide accommodation credentials, location coordinates, amenities, and media.
        </p>
      </div>

      {(error || logoError || galleryError) && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-2xl text-xs" role="alert">
          {error || logoError || galleryError}
        </div>
      )}

      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#231A14] text-white dark:bg-[#EAE2D8] dark:text-[#181310] rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-200 text-xs font-semibold">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>Guesthouse saved successfully! Redirecting...</span>
        </div>
      )}

      {/* Form & Live Preview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column (2/3) */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="glass-panel rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#231A14] dark:text-[#F7F4EF] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670]" />
              <span>Core Information</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#524438] dark:text-[#D4BA9E] mb-1.5">
                Guesthouse Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Kasane Chobe Bush Lodge"
                className="w-full px-3.5 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden focus:ring-1 focus:ring-[#9E7246]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#524438] dark:text-[#D4BA9E] mb-1.5">
                Overview & Guest Experience *
              </label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the rooms, veranda, garden morning views, and hospitality..."
                className="w-full px-3.5 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden focus:ring-1 focus:ring-[#9E7246] leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Location & Coordinates */}
          <div className="glass-panel rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#231A14] dark:text-[#F7F4EF] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670]" />
              <span>Location & Navigation</span>
            </h2>

            {/* Quick City Presets */}
            <div>
              <label className="block text-xs font-semibold text-[#524438] dark:text-[#D4BA9E] mb-1.5">
                Select City / Region (Auto-fills GPS coordinates)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(CITY_PRESETS).map((cityName) => (
                  <button
                    key={cityName}
                    type="button"
                    onClick={() => handleCityChange(cityName)}
                    className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-all cursor-pointer ${
                      form.city === cityName
                        ? 'bg-[#231A14] text-white dark:bg-[#EAE2D8] dark:text-[#181310] shadow-xs'
                        : 'bg-black/[0.03] dark:bg-white/[0.05] text-[#7A6C60] dark:text-[#A69788] hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    {cityName}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#524438] dark:text-[#D4BA9E] mb-1.5">
                  City / Town *
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Kasane"
                  className="w-full px-3.5 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden focus:ring-1 focus:ring-[#9E7246]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#524438] dark:text-[#D4BA9E] mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={form.country || 'Botswana'}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Latitude & Longitude */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-[#8F7F70] dark:text-[#9E8E80] mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.coordinates.lat}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      coordinates: {
                        ...form.coordinates,
                        lat: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8F7F70] dark:text-[#9E8E80] mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.coordinates.lng}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      coordinates: {
                        ...form.coordinates,
                        lng: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Price & Contact Details */}
          <div className="glass-panel rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#231A14] dark:text-[#F7F4EF] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670]" />
              <span>Price & Guest Contact</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#524438] dark:text-[#D4BA9E] mb-1.5">
                  Price per Night ({currency.code}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-[#8F7F70]">
                    {currency.symbol}
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.pricePerNight}
                    onChange={(e) =>
                      setForm({ ...form, pricePerNight: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-8 pr-3.5 py-2 text-xs font-mono font-bold bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#524438] dark:text-[#D4BA9E] mb-1.5">
                  Reservations Phone & Email *
                </label>
                <input
                  type="text"
                  required
                  value={form.contactDetails}
                  onChange={(e) => setForm({ ...form, contactDetails: e.target.value })}
                  placeholder="+267 71 234 567 | stay@domain.co.bw"
                  className="w-full px-3.5 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Amenities */}
          <div className="glass-panel rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#231A14] dark:text-[#F7F4EF] flex items-center gap-2">
              <Check className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670]" />
              <span>Amenities & Facilities</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POPULAR_AMENITIES.map((item) => {
                const selected = form.amenities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAmenity(item)}
                    className={`flex items-center gap-2 px-3 py-2 text-xs rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? 'bg-[#231A14] text-white dark:bg-[#EAE2D8] dark:text-[#181310] border-[#231A14] dark:border-[#EAE2D8] shadow-xs'
                        : 'bg-black/[0.02] dark:bg-white/[0.03] text-[#6E6258] dark:text-[#B5A596] border-black/[0.05] dark:border-white/[0.07] hover:bg-black/[0.04]'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[10px] ${selected ? 'bg-white/20' : 'border border-black/20 dark:border-white/20'}`}>
                      {selected && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <span className="truncate">{item}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Amenity Input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Add custom amenity (e.g. Quad Bikes)..."
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomAmenity();
                  }
                }}
                className="flex-1 px-3.5 py-1.5 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden"
              />
              <button
                type="button"
                onClick={addCustomAmenity}
                className="px-3 py-1.5 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] text-xs font-semibold rounded-xl text-[#231A14] dark:text-[#F7F4EF] transition-colors cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Section 5: Media & Photography */}
          <div className="glass-panel rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#231A14] dark:text-[#F7F4EF] flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670]" />
              <span>Media & Visual Assets</span>
            </h2>

            {/* Logo Cover Photo Upload */}
            <div>
              <label className="block text-xs font-semibold text-[#524438] dark:text-[#D4BA9E] mb-1.5">
                Primary Logo / Facade Cover
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] border border-dashed border-black/[0.1] dark:border-white/[0.12] overflow-hidden flex items-center justify-center shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-[#8F7F70]" />
                  )}
                </div>
                <div className="space-y-1">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={saving || preparingImages}
                    onChange={(e) => {
                      void handleLogoUpload(e.target.files?.[0] || null);
                      e.currentTarget.value = '';
                    }}
                    className="text-xs text-[#7A6C60] dark:text-[#A69788] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#231A14] file:text-white dark:file:bg-[#EAE2D8] dark:file:text-[#181310] file:cursor-pointer"
                  />
                  <p className="text-[11px] text-[#8F7F70] dark:text-[#9E8E80]">
                    Upload an image file (PNG, JPG, or WEBP), up to 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery Upload */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-[#524438] dark:text-[#D4BA9E] mb-1.5">
                Room & Garden Photos
              </label>
              <p className="text-[11px] text-[#8F7F70] dark:text-[#9E8E80] mb-2">
                Upload PNG, JPG, or WEBP files up to 5MB each. Photos are sent to Firebase Storage when you save.
              </p>
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                disabled={saving || preparingImages}
                onChange={(e) => {
                  void handleGalleryUpload(Array.from(e.target.files || []));
                  e.currentTarget.value = '';
                }}
                className="text-xs text-[#7A6C60] dark:text-[#A69788] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#231A14] file:text-white dark:file:bg-[#EAE2D8] dark:file:text-[#181310] file:cursor-pointer"
              />

              {galleryPreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {galleryPreviews.map((preview, idx) => (
                    <div key={idx} className="aspect-4/3 rounded-xl overflow-hidden bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]">
                      <img src={preview} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              {preparingImages && (
                <p className="mt-2 text-[11px] text-[#7A6C60] dark:text-[#A69788]" role="status">
                  Optimizing photos for faster upload...
                </p>
              )}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-2">
            {id ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Guesthouse</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <Link
                to="/guesthouses"
                className="px-4 py-2 text-xs font-semibold text-[#7A6C60] hover:text-[#231A14] dark:text-[#A69788] dark:hover:text-[#F7F4EF] transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || preparingImages}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#231A14] hover:bg-[#372A22] dark:bg-[#EAE2D8] dark:text-[#181310] dark:hover:bg-white text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <span>{logoFile || galleryFiles.length ? 'Uploading photos & saving...' : 'Saving guesthouse...'}</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#D6A670] dark:text-[#9E7246]" />
                    <span>{id ? 'Save Changes' : 'Register Guesthouse'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Live Preview Column (1/3 Sticky) */}
        <div className="space-y-4">
          <div className="sticky top-20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8F7F70] dark:text-[#9E8E80]">
                Live Platform Preview
              </span>
              <span className="text-[11px] text-[#9E7246] dark:text-[#D6A670] font-mono">
                Real-Time
              </span>
            </div>

            {/* Simulated Live Card */}
            <div className="glass-card rounded-2xl overflow-hidden shadow-md">
              <div className="aspect-16/10 bg-black/[0.04] dark:bg-white/[0.04] overflow-hidden relative">
                <img
                  src={
                    logoPreview ||
                    (galleryPreviews.length > 0 ? galleryPreviews[0] : '') ||
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
                  }
                  alt="Preview Cover"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-[#8F7F70] dark:text-[#9E8E80]">
                  <MapPin className="w-3.5 h-3.5 text-[#9E7246] dark:text-[#D6A670]" />
                  <span>{form.city || 'Gaborone'} · {form.country || 'Botswana'}</span>
                </div>

                <h3 className="font-bold text-base text-[#231A14] dark:text-[#F7F4EF] truncate">
                  {form.name || 'Untitled Guesthouse'}
                </h3>

                <p className="text-xs text-[#6E6258] dark:text-[#A69788] line-clamp-2 leading-relaxed">
                  {form.description || 'Provide an overview of the guesthouse to display here.'}
                </p>

                <div className="pt-3 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#8F7F70] block">
                      Price
                    </span>
                    <span className="text-base font-bold font-mono tabular-nums text-[#231A14] dark:text-[#F7F4EF]">
                      {formatPrice(form.pricePerNight)}
                    </span>
                    <span className="text-[11px] text-[#7A6C60] ml-1">/ night</span>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 bg-black/[0.03] dark:bg-white/[0.05] rounded-lg text-[#372A22] dark:text-[#EAE2D8]">
                    Preview
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.06] text-xs space-y-1.5 text-[#7A6C60] dark:text-[#A69788]">
              <p className="font-semibold text-[#231A14] dark:text-[#F7F4EF] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#9E7246] dark:text-[#D6A670]" />
                <span>Publishing Protocol</span>
              </p>
              <p className="leading-relaxed">
                Registered properties appear immediately in the admin directory and live discovery indexes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

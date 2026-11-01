import { Link } from 'react-router-dom';
import {
  MapPin,
  Edit2,
  Eye,
  Wifi,
  Waves,
  SunMedium,
  Coffee,
  Sparkles,
  PauseCircle,   // NEW – suspend icon
  PlayCircle,    // NEW – activate icon
} from 'lucide-react';
import type { Guesthouse } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface PropertyCardProps {
  property: Guesthouse;
  onPreview: (property: Guesthouse) => void;
  // ── NEW ──────────────────────────────────────────────────────────────────────
  // Called when the admin clicks Suspend or Activate on this card.
  // Guesthouses.tsx owns the actual API call; the card just triggers it.
  onSuspend?: (id: string, name: string, currentStatus: string) => void;
  suspending?: boolean; // true while the API call for THIS card is in flight
  // ─────────────────────────────────────────────────────────────────────────────
}

export default function PropertyCard({
  property,
  onPreview,
  onSuspend,
  suspending = false,
}: PropertyCardProps) {
  const { formatPrice } = useSettings();

  const thumbnail =
    property.logo ||
    (property.gallery && property.gallery[0]) ||
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

  // ── NEW: derive suspension state from the status field ────────────────────
  const isSuspended = property.status === 'suspended';

  const getAmenityIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('wifi')) return <Wifi className="w-3 h-3 text-[#9E7246] dark:text-[#D6A670]" />;
    if (lower.includes('pool') || lower.includes('river')) return <Waves className="w-3 h-3 text-[#5A7E94]" />;
    if (lower.includes('solar') || lower.includes('garden')) return <SunMedium className="w-3 h-3 text-[#B58752]" />;
    if (lower.includes('breakfast')) return <Coffee className="w-3 h-3 text-[#64846B]" />;
    return <Sparkles className="w-3 h-3 text-[#9E7246] dark:text-[#D6A670]" />;
  };

  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden flex flex-col group transition-all duration-200 ${
        // ── NEW: dim the card slightly when suspended so it's visually distinct
        isSuspended ? 'opacity-70 ring-1 ring-amber-400/40 dark:ring-amber-500/30' : ''
      }`}
    >
      {/* Property Image Cover */}
      <div className="relative aspect-16/10 bg-black/[0.04] dark:bg-white/[0.04] overflow-hidden">
        <img
          src={thumbnail}
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* ── NEW: Status badge — top-right corner of the image ──────────────── */}
        <div className="absolute top-2.5 right-2.5">
          {isSuspended ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-wide rounded-lg bg-amber-400/90 text-amber-900 shadow-sm backdrop-blur-sm">
              <PauseCircle className="w-3 h-3" />
              Suspended
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-wide rounded-lg bg-emerald-500/90 text-white shadow-sm backdrop-blur-sm">
              <PlayCircle className="w-3 h-3" />
              Active
            </span>
          )}
        </div>
        {/* ──────────────────────────────────────────────────────────────────── */}
      </div>

      {/* Property Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Unboxed Location Metadata */}
          <div className="flex items-center gap-1.5 text-xs text-[#8F7F70] dark:text-[#9E8E80] mb-1">
            <MapPin className="w-3.5 h-3.5 text-[#9E7246] dark:text-[#D6A670] shrink-0" />
            <span className="font-medium text-[#524438] dark:text-[#D4BA9E]">
              {property.city} · {property.country || 'Botswana'}
            </span>
          </div>

          <h3 className="font-bold text-[#231A14] dark:text-[#F7F4EF] text-base leading-snug tracking-tight group-hover:text-[#9E7246] dark:group-hover:text-[#D6A670] transition-colors line-clamp-1">
            {property.name}
          </h3>

          <p className="text-xs text-[#6E6258] dark:text-[#A69788] mt-1.5 line-clamp-2 leading-relaxed">
            {property.description || 'Boutique accommodation property in Botswana.'}
          </p>

          {/* Amenities Row */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {property.amenities.slice(0, 3).map((amenity, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-black/[0.03] dark:bg-white/[0.05] text-[#524438] dark:text-[#D8C7B5] border border-black/[0.05] dark:border-white/[0.07] rounded-lg"
                >
                  {getAmenityIcon(amenity)}
                  <span className="truncate max-w-[100px]">{amenity}</span>
                </span>
              ))}
              {property.amenities.length > 3 && (
                <span className="text-[11px] text-[#8F7F70] dark:text-[#7A6C60] font-medium">
                  +{property.amenities.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer: Nightly Rate & Action Buttons */}
        <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between gap-2">
          <div className="shrink-0">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8F7F70] dark:text-[#7A6C60] block">
              Price
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold font-mono tabular-nums text-[#231A14] dark:text-[#F7F4EF]">
                {formatPrice(property.pricePerNight)}
              </span>
              <span className="text-[11px] text-[#7A6C60] dark:text-[#A69788]">/ night</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* Quick-preview button — unchanged */}
            <button
              onClick={() => onPreview(property)}
              className="p-2 text-[#7A6C60] hover:text-[#231A14] dark:text-[#A69788] dark:hover:text-[#F7F4EF] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
              title="Quick Dossier"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Edit button — unchanged */}
            <Link
              to={`/guesthouses/${property._id}/edit`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#231A14] dark:text-[#EAE2D8] bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.08] rounded-xl transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Link>

            {/* ── NEW: Suspend / Activate button ──────────────────────────── */}
            {onSuspend && property._id && (
              <button
                onClick={() => onSuspend(property._id!, property.name, property.status ?? 'active')}
                disabled={suspending}
                title={isSuspended ? 'Reactivate this listing' : 'Suspend this listing'}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait ${
                  isSuspended
                    ? // Suspended → show green Activate button
                      'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800'
                    : // Active → show amber Suspend button
                      'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {suspending ? (
                  <span className="text-[10px]">Wait…</span>
                ) : isSuspended ? (
                  <>
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Activate</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>Suspend</span>
                  </>
                )}
              </button>
            )}
            {/* ──────────────────────────────────────────────────────────────── */}
          </div>
        </div>
      </div>
    </div>
  );
}

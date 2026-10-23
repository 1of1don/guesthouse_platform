import { Link } from 'react-router-dom';
import {
  X,
  MapPin,
  ExternalLink,
  Edit,
  Phone,
  Compass,
} from 'lucide-react';
import type { Guesthouse } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface PropertyDetailModalProps {
  property: Guesthouse | null;
  onClose: () => void;
}

export default function PropertyDetailModal({
  property,
  onClose,
}: PropertyDetailModalProps) {
  const { formatPrice } = useSettings();
  if (!property) return null;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${property.coordinates.lat},${property.coordinates.lng}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white/95 dark:bg-[#181412]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/80 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[#9E7246] dark:text-[#D6A670]">
              Property Dossier
            </span>
            <span aria-hidden="true" className="text-black/20 dark:text-white/20">·</span>
            <span className="text-[#8F7F70] dark:text-[#9E8E80] font-mono">{property._id}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7A6C60] hover:text-[#231A14] dark:text-[#A69788] dark:hover:text-[#F7F4EF] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Main Hero Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#8F7F70] dark:text-[#9E8E80] mb-1">
                <MapPin className="w-3.5 h-3.5 text-[#9E7246] dark:text-[#D6A670] shrink-0" />
                <span className="font-medium text-[#524438] dark:text-[#D4BA9E]">
                  {property.city} · {property.country || 'Botswana'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#231A14] dark:text-[#F7F4EF] tracking-tight">
                {property.name}
              </h2>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8F7F70] dark:text-[#7A6C60] block">
                Tariff
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono tabular-nums text-[#231A14] dark:text-[#F7F4EF]">
                  {formatPrice(property.pricePerNight)}
                </span>
                <span className="text-[11px] text-[#7A6C60] dark:text-[#A69788]">/ night</span>
              </div>
            </div>
          </div>

          {/* Gallery Showcase */}
          {property.gallery && property.gallery.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#8F7F70] dark:text-[#9E8E80] uppercase tracking-wider mb-2">
                Property Imagery
              </p>
              <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08]">
                {property.gallery.slice(0, 3).map((img, i) => (
                  <div key={i} className="aspect-4/3 bg-black/[0.04] dark:bg-white/[0.04] overflow-hidden">
                    <img
                      src={img}
                      alt={`${property.name} ${i + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-[11px] font-semibold text-[#8F7F70] dark:text-[#9E8E80] uppercase tracking-wider mb-1.5">
              Overview
            </p>
            <p className="text-sm text-[#4A3B2C] dark:text-[#D8C7B5] leading-relaxed">
              {property.description}
            </p>
          </div>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#8F7F70] dark:text-[#9E8E80] uppercase tracking-wider mb-2">
                Amenities & Services
              </p>
              <div className="flex flex-wrap gap-1.5">
                {property.amenities.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.07] text-[#4A3B2C] dark:text-[#E8D8C3] rounded-xl font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact Details & Geo Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] text-xs">
            <div>
              <p className="font-semibold text-[#231A14] dark:text-[#F7F4EF] mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#9E7246] dark:text-[#D6A670]" />
                <span>Contact Details</span>
              </p>
              <p className="text-[#6E6258] dark:text-[#A69788] leading-relaxed">
                {property.contactDetails || 'None provided'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-[#231A14] dark:text-[#F7F4EF] mb-1 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#9E7246] dark:text-[#D6A670]" />
                <span>Coordinates</span>
              </p>
              <p className="font-mono text-[11px] text-[#6E6258] dark:text-[#A69788]">
                {property.coordinates.lat.toFixed(4)}, {property.coordinates.lng.toFixed(4)}
              </p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-[#9E7246] hover:text-[#845A32] dark:text-[#D6A670] font-medium"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#7A6C60] dark:text-[#A69788] hover:text-[#231A14] dark:hover:text-[#F7F4EF] transition-colors cursor-pointer"
          >
            Close
          </button>
          <Link
            to={`/guesthouses/${property._id}/edit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#231A14] hover:bg-[#372A22] dark:bg-[#EAE2D8] dark:text-[#181310] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Guesthouse</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

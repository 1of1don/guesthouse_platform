import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Building2, Star, Search, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import type { Guesthouse } from '../types';

// ── Fix Leaflet's broken icon paths in Vite builds ────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ── Coloured dot marker — green = active, amber = suspended ──────────────────
function makeIcon(status: string) {
  const bg = status === 'suspended' ? '#F59E0B' : '#10B981';
  return L.divIcon({
    html: `<div style="background:${bg};width:14px;height:14px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize: [14, 14],
    className: '',
  });
}

// ── Inner component: smoothly flies the map to a chosen property ─────────────
function FlyTo({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 15, { animate: true, duration: 1 });
  }, [coords, map]);
  return null;
}

export default function MapView() {
  const { formatPrice } = useSettings();
  const [items, setItems] = useState<Guesthouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Guesthouse | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  // Load all guesthouses on mount
  useEffect(() => {
    api
      .getGuesthouses()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  // Filter list by search query
  const filtered = items.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.city.toLowerCase().includes(search.toLowerCase()),
  );

  // Click a card in the rail → fly the map there and open the marker popup
  const handleSelect = (gh: Guesthouse) => {
    setSelected(gh);
    setFlyTo([gh.coordinates.lat, gh.coordinates.lng]);
    setTimeout(() => {
      if (gh._id) markerRefs.current[gh._id]?.openPopup();
    }, 1100);
  };

  const activeCount = items.filter((g) => g.status !== 'suspended').length;
  const suspendedCount = items.filter((g) => g.status === 'suspended').length;

  return (
    <div className="space-y-5">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-2 text-xs font-medium text-[#8F7F70] dark:text-[#9E8E80]">
          <span>Catalog</span>
          <span className="text-black/20 dark:text-white/20">·</span>
          <span>Map View</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#231A14] dark:text-[#F7F4EF] mt-1">
          Guesthouse Map
        </h1>
        <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-0.5">
          Browse all registered properties across Botswana on an interactive map.
        </p>
      </div>

      {/* ── Legend + counts ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
          <span className="text-[#6B7280] dark:text-[#9E8E80]">
            Active ({activeCount})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-sm" />
          <span className="text-[#6B7280] dark:text-[#9E8E80]">
            Suspended ({suspendedCount})
          </span>
        </div>
        <span className="text-[#D1C7BC] dark:text-[#4A3F36]">·</span>
        <span className="text-[#9E8E80] font-mono tabular-nums">
          {items.length} total properties
        </span>
      </div>

      {/* ── Map + Sidebar layout ─────────────────────────────────────────── */}
      <div className="flex gap-4" style={{ height: '580px' }}>

        {/* Interactive Leaflet Map */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-black/[0.07] dark:border-white/[0.08] shadow-sm min-w-0">
          {loading ? (
            <div className="w-full h-full bg-black/[0.03] dark:bg-white/[0.03] flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-[#A57C52] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#8F7F70]">Loading map…</p>
            </div>
          ) : (
            <MapContainer
              center={[-24.6282, 25.9231]}
              zoom={12}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Fly-to controller */}
              <FlyTo coords={flyTo} />

              {/* One marker per guesthouse */}
              {items.map((gh) => (
                <Marker
                  key={gh._id}
                  position={[gh.coordinates.lat, gh.coordinates.lng]}
                  icon={makeIcon(gh.status ?? 'active')}
                  ref={(ref) => {
                    if (ref && gh._id) markerRefs.current[gh._id] = ref;
                  }}
                  eventHandlers={{ click: () => setSelected(gh) }}
                >
                  <Popup>
                    <div style={{ minWidth: 185, fontFamily: 'sans-serif' }}>
                      <strong style={{ fontSize: 14 }}>{gh.name}</strong>
                      <br />
                      <span style={{ color: '#6B7280', fontSize: 12 }}>
                        {gh.city}, Botswana
                      </span>
                      <br />
                      <span
                        style={{
                          color: '#059669',
                          fontWeight: 700,
                          fontSize: 14,
                          display: 'block',
                          marginTop: 6,
                        }}
                      >
                        {formatPrice(gh.pricePerNight)}/night
                      </span>
                      <span
                        style={{
                          background:
                            gh.status === 'suspended' ? '#FEF3C7' : '#D1FAE5',
                          color:
                            gh.status === 'suspended' ? '#92400E' : '#065F46',
                          padding: '2px 8px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {gh.status ?? 'active'}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* ── Property list rail ─────────────────────────────────────────── */}
        <div className="w-72 flex flex-col gap-2 flex-shrink-0">
          {/* Search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9E7246] dark:text-[#D6A670] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search properties…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-xs bg-white dark:bg-[#131929] border border-black/[0.07] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] placeholder:text-[#9E8E80] focus:outline-none focus:ring-1 focus:ring-[#9E7246]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-[#9E8E80] hover:text-[#231A14] dark:hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Scrollable card list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] animate-pulse"
                />
              ))
            ) : filtered.length === 0 ? (
              <div className="glass-panel rounded-xl p-6 text-center">
                <Building2 className="w-7 h-7 text-[#9E7246] mx-auto mb-2" />
                <p className="text-xs text-[#7A6C60] dark:text-[#A69788]">
                  No properties found.
                </p>
              </div>
            ) : (
              filtered.map((gh) => (
                <button
                  key={gh._id}
                  onClick={() => handleSelect(gh)}
                  className={`w-full glass-panel rounded-xl p-3 text-left transition-all cursor-pointer ${
                    selected?._id === gh._id
                      ? 'ring-2 ring-[#9E7246] dark:ring-[#D6A670] bg-[#FDF8F3] dark:bg-[#1E1510]'
                      : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Status dot */}
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
                        gh.status === 'suspended'
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs text-[#231A14] dark:text-[#F7F4EF] truncate leading-tight">
                        {gh.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#9E7246] flex-shrink-0" />
                        <span className="text-[11px] text-[#7A6C60] dark:text-[#A69788] truncate">
                          {gh.city}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs font-bold text-[#9E7246] dark:text-[#D6A670]">
                          {formatPrice(gh.pricePerNight)}/night
                        </span>
                        {gh.rating && gh.rating > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-[#9E7246] text-[#9E7246]" />
                            <span className="text-[11px] font-mono text-[#6B7280]">
                              {gh.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

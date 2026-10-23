import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Star,
  RotateCcw,
  LayoutGrid,
  List,
  Eye,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import PropertyCard from '../components/ui/PropertyCard';
import PropertyDetailModal from '../components/ui/PropertyDetailModal';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import type { Guesthouse } from '../types';

export default function Guesthouses() {
  const { formatPrice, currency } = useSettings();

  const [items, setItems] = useState<Guesthouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating' | 'newest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [previewProperty, setPreviewProperty] = useState<Guesthouse | null>(null);

  const loadData = () => {
    setLoading(true);
    api.getGuesthouses()
      .then((data) => {
        setItems(data);
        setError('');
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error ? cause.message : 'Unable to load guesthouses catalog.',
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await api.deleteGuesthouse(id);
        setItems((prev) => prev.filter((item) => item._id !== id));
      } catch (cause) {
        alert(cause instanceof Error ? cause.message : 'Unable to delete guesthouse.');
      }
    }
  };

  const allCities = useMemo(() => {
    const set = new Set<string>();
    items.forEach((g) => {
      if (g.city) set.add(g.city);
    });
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (cityFilter !== 'all') {
      result = result.filter(
        (g) => g.city.toLowerCase() === cityFilter.toLowerCase(),
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((g) => {
        const matchName = g.name.toLowerCase().includes(q);
        const matchCity = g.city.toLowerCase().includes(q);
        const matchDesc = (g.description || '').toLowerCase().includes(q);
        const matchAmenity = (g.amenities || []).some((a) => a.toLowerCase().includes(q));
        return matchName || matchCity || matchDesc || matchAmenity;
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'price-asc') return (a.pricePerNight || 0) - (b.pricePerNight || 0);
      if (sortBy === 'price-desc') return (b.pricePerNight || 0) - (a.pricePerNight || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    return result;
  }, [items, cityFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header with Title and Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#8F7F70] dark:text-[#9E8E80]">
            <span>Catalog</span>
            <span aria-hidden="true" className="text-black/20 dark:text-white/20">·</span>
            <span>Accommodation Inventory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#231A14] dark:text-[#F7F4EF] mt-1">
            Guesthouses Directory
          </h1>
          <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-0.5">
            Manage, search, and update boutique guesthouse listings across Botswana.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle Buttons */}
          <div className="flex items-center p-1 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] rounded-xl text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#251E1A] text-[#231A14] dark:text-[#F7F4EF] shadow-xs'
                  : 'text-[#8F7F70] hover:text-[#231A14] dark:hover:text-[#F7F4EF]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#251E1A] text-[#231A14] dark:text-[#F7F4EF] shadow-xs'
                  : 'text-[#8F7F70] hover:text-[#231A14] dark:hover:text-[#F7F4EF]'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Link
            to="/guesthouses/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#231A14] hover:bg-[#372A22] dark:bg-[#EAE2D8] dark:text-[#181310] dark:hover:bg-white rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#D6A670] dark:text-[#9E7246]" />
            <span>Add Guesthouse</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar in Glass Panel */}
      <div className="glass-panel p-3.5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, city, amenity (e.g. Garden, Pool)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] placeholder:text-[#9E8E80] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden focus:ring-1 focus:ring-[#9E7246]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-xs text-[#8F7F70] hover:text-[#231A14] dark:hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* City Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#8F7F70] dark:text-[#9E8E80] font-medium">City:</span>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Cities ({items.length})</option>
              {allCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#8F7F70] dark:text-[#9E8E80] font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-2.5 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="newest">Recently Registered</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {(searchQuery || cityFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCityFilter('all');
              }}
              className="inline-flex items-center gap-1 text-xs text-[#9E7246] hover:text-[#845A32] dark:text-[#D6A670] hover:underline font-medium px-2 py-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-2xl text-xs" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl h-72" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-[#9E7246] dark:text-[#D6A670] flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#231A14] dark:text-[#F7F4EF] text-base">
            {items.length === 0 ? 'No guesthouses registered yet' : 'No properties match your filter'}
          </h3>
          <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-1 max-w-sm mx-auto leading-relaxed">
            {items.length === 0
              ? 'Your guesthouse directory is empty. Click "+ Register Guesthouse" to add your first property.'
              : 'Try adjusting your search query, clearing your filters, or registering a new guesthouse.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            {items.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCityFilter('all');
                }}
                className="px-3.5 py-1.5 bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] rounded-xl text-xs font-semibold text-[#372A22] dark:text-[#EAE2D8] cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <Link
              to="/guesthouses/new"
              className="px-4 py-2 bg-[#231A14] hover:bg-[#372A22] dark:bg-[#EAE2D8] dark:text-[#181310] text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              + Register Guesthouse
            </Link>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((guesthouse) => (
            <PropertyCard
              key={guesthouse._id}
              property={guesthouse}
              onPreview={setPreviewProperty}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-black/[0.05] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] text-[#8F7F70] dark:text-[#9E8E80] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Guesthouse</th>
                  <th className="py-3 px-4">City / Area</th>
                  <th className="py-3 px-4">Key Amenities</th>
                  <th className="py-3 px-4 text-right">Price / Night ({currency.code})</th>
                  <th className="py-3 px-4 text-center">Mobile Rating</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                {filteredItems.map((g) => {
                  const thumb =
                    g.logo ||
                    (g.gallery && g.gallery[0]) ||
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=150&q=80';
                  return (
                    <tr
                      key={g._id}
                      className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={thumb}
                            alt={g.name}
                            className="w-10 h-10 rounded-xl object-cover bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=150&q=80';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-[#231A14] dark:text-[#F7F4EF] truncate max-w-xs group-hover:text-[#9E7246] dark:group-hover:text-[#D6A670] transition-colors">
                              {g.name}
                            </p>
                            <p className="text-[11px] text-[#7A6C60] dark:text-[#A69788] truncate mt-0.5">
                              {g.contactDetails}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-[#524438] dark:text-[#D4BA9E]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#9E7246] dark:text-[#D6A670]" />
                          <span>{g.city}, Botswana</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {(g.amenities || []).slice(0, 2).map((a, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-[10px] bg-black/[0.03] dark:bg-white/[0.05] rounded text-[#524438] dark:text-[#D8C7B5]"
                            >
                              {a}
                            </span>
                          ))}
                          {(g.amenities || []).length > 2 && (
                            <span className="text-[10px] text-[#8F7F70] dark:text-[#7A6C60]">
                              +{(g.amenities || []).length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono tabular-nums font-semibold text-[#231A14] dark:text-[#F7F4EF]">
                        {formatPrice(g.pricePerNight)}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {g.rating && g.rating > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[#231A14] dark:text-[#F7F4EF] font-semibold font-mono tabular-nums">
                            <Star className="w-3.5 h-3.5 fill-[#9E7246] text-[#9E7246]" />
                            {g.rating.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[#8F7F70] dark:text-[#7A6C60] font-mono text-[11px]">
                            —
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => setPreviewProperty(g)}
                          className="p-1.5 text-[#7A6C60] hover:text-[#231A14] dark:text-[#A69788] dark:hover:text-[#F7F4EF] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] rounded-lg transition-colors cursor-pointer"
                          title="Quick Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/guesthouses/${g._id}/edit`}
                          className="inline-flex items-center px-2 py-1 text-xs font-semibold text-[#372A22] dark:text-[#EAE2D8] bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.08] rounded-lg transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => g._id && handleDelete(g._id, g.name)}
                          className="p-1.5 text-[#8F7F70] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Delete Property"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Property Detail Modal */}
      <PropertyDetailModal
        property={previewProperty}
        onClose={() => setPreviewProperty(null)}
      />
    </div>
  );
}

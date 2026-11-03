// SEARCH AND FILTERS: the Explore list logic (search text, price, rating, sort order).
import { Filters, Guesthouse } from '../types';

export const DEFAULT_FILTERS: Filters = { sort: 'price_asc', maxPrice: null, minRating: 0 };

// How many filters differ from the default. Shown as a small number on the filter button.
export function countActiveFilters(f: Filters) {
  return (f.sort !== DEFAULT_FILTERS.sort ? 1 : 0) + (f.maxPrice !== null ? 1 : 0) + (f.minRating > 0 ? 1 : 0);
}

// Matches name, city or country, applies the filters, then sorts. Default is cheapest first.
export function searchGuesthouses(list: Guesthouse[], query: string, filters: Filters) {
  const q = query.trim().toLowerCase();
  const filtered = list.filter((g) => {
    const matchesText = !q || [g.name, g.city, g.country].some((f) => f.toLowerCase().includes(q));
    const matchesPrice = filters.maxPrice === null || g.pricePerNight <= filters.maxPrice;
    const matchesRating = filters.minRating === 0 || g.averageRating >= filters.minRating;
    return matchesText && matchesPrice && matchesRating;
  });
  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (filters.sort) {
      case 'price_desc': return b.pricePerNight - a.pricePerNight;
      case 'rating_desc': return b.averageRating - a.averageRating || a.pricePerNight - b.pricePerNight;
      case 'rating_asc': return a.averageRating - b.averageRating || a.pricePerNight - b.pricePerNight;
      default: return a.pricePerNight - b.pricePerNight;
    }
  });
  return sorted;
}

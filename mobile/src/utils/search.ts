import { Guesthouse, SortKey } from '../types';

// Matches name, city or country. Always sorts; default is cheapest first.
export function searchGuesthouses(list: Guesthouse[], query: string, sort: SortKey) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? list.filter((g) => [g.name, g.city, g.country].some((f) => f.toLowerCase().includes(q)))
    : list;
  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (sort) {
      case 'price_desc': return b.pricePerNight - a.pricePerNight;
      case 'rating_desc': return b.averageRating - a.averageRating || a.pricePerNight - b.pricePerNight;
      case 'rating_asc': return a.averageRating - b.averageRating || a.pricePerNight - b.pricePerNight;
      default: return a.pricePerNight - b.pricePerNight;
    }
  });
  return sorted;
}

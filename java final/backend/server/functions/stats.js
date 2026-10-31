// FUNCTIONS: numbers for the admin dashboard.
// compute() is a plain function (list in, numbers out), so it is easy to test and to extend.
// To add a statistic: add one line to the object returned by compute().
const guesthouseFunc = require('./guesthouse');

function compute(guesthouses, now = new Date()) {
  // How many guesthouses per city, and the average price per city.
  const cities = {};
  for (const g of guesthouses) {
    const c = (cities[g.city] ||= { count: 0, priceTotal: 0 });
    c.count += 1;
    c.priceTotal += g.pricePerNight || 0;
  }

  const topCity = Object.entries(cities).sort((a, b) => b[1].count - a[1].count)[0];

  // Highest rated: only guesthouses with at least one rating. Ties go to the one with more ratings.
  const rated = guesthouses.filter((g) => g.ratingCount > 0);
  rated.sort((a, b) => b.averageRating - a.averageRating || b.ratingCount - a.ratingCount);
  const best = rated[0];

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    totalGuesthouses: guesthouses.length,
    topCity: topCity ? { city: topCity[0], count: topCity[1].count } : null,
    highestRated: best
      ? { id: best.id, name: best.name, averageRating: best.averageRating, ratingCount: best.ratingCount }
      : null,
    addedThisMonth: guesthouses.filter((g) => g.createdAt && new Date(g.createdAt) >= monthStart).length,
    averagePriceByCity: Object.fromEntries(
      Object.entries(cities).map(([city, c]) => [city, Math.round(c.priceTotal / c.count)]),
    ),
  };
}

async function dashboard() {
  return compute(await guesthouseFunc.list());
}

module.exports = { compute, dashboard };

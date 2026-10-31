// Turns a Firestore document into a plain object for JSON:
// adds the id, and turns Firestore timestamps into ISO text (e.g. "2026-10-29T10:00:00.000Z").
module.exports = function plain(doc) {
  const out = { id: doc.id };
  for (const [key, value] of Object.entries(doc.data())) {
    out[key] = value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value;
  }
  return out;
};

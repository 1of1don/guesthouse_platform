// MODEL: a customer's rating of a guesthouse. Collection: ratings/{guesthouseId}_{customerId}.
// The mobile app creates these. The backend only reads them and lets staff delete them.
const { db } = require('../config/firebase');

module.exports = { collection: () => db.collection('ratings') };

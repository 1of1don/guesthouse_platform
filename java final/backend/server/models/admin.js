// MODEL: a staff member. Collection: admins/{uid}, where uid is the Firebase Authentication user id.
const { db } = require('../config/firebase');

module.exports = { collection: () => db.collection('admins') };

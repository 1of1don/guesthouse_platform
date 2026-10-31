// FUNCTIONS: login checking. Answers "who is calling, and are they staff?".
// The web app logs in with Firebase Authentication, then sends the resulting token on every request:
//   Authorization: Bearer <token>
const { auth } = require('../config/firebase');
const admin = require('../models/admin');
const { fail } = require('../errors');

// Reads the token from the request, checks it with Firebase, and finds the staff record.
// Returns { uid, name, email, role }. Fails with 401 (not logged in) or 403 (logged in but not staff).
async function verifyAccount(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) fail(401, 'Missing login token');

  let decoded;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    fail(401, 'Invalid or expired login token');
  }

  const snap = await admin.collection().doc(decoded.uid).get();
  if (!snap.exists) fail(403, 'This account is not staff');
  const { name, email, role, status } = snap.data();
  if (status === 'suspended') fail(403, 'This account is suspended');
  return { uid: decoded.uid, name, email, role };
}

module.exports = { verifyAccount };

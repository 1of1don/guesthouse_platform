// FUNCTIONS: staff management (super admin only, see routes.js).
// Creating a staff login has to happen on the server: doing it in the browser would sign the
// super admin out. The Admin SDK creates the account without touching anyone's session.
const { auth, FieldValue } = require('../config/firebase');
const admin = require('../models/admin');
const plain = require('../models/plain');
const { ROLES } = require('../config/roles');
const { fail } = require('../errors');

async function list() {
  const snap = await admin.collection().get();
  return snap.docs.map(plain);
}

// 1) create the Firebase login  2) write the staff record that gives it a role.
async function create({ name, email, password, role } = {}, byUid) {
  if (!name || !email || !password) fail(400, 'name, email and password are required');
  if (String(password).length < 6) fail(400, 'password must be at least 6 characters');
  if (!ROLES.includes(role)) fail(400, `role must be one of: ${ROLES.join(', ')}`);

  let user;
  try {
    user = await auth.createUser({ email, password, displayName: name });
  } catch (e) {
    if (e.code === 'auth/email-already-exists') fail(409, 'An account with this email already exists');
    throw e;
  }

  await admin.collection().doc(user.uid).set({
    name, email, role, status: 'active', createdBy: byUid, createdAt: FieldValue.serverTimestamp(),
  });
  return { id: user.uid, name, email, role };
}

// Suspends a staff member: their record stays, but the login is switched off.
// Nobody can suspend themselves, so at least one super admin is always left.
async function remove(uid, byUid) {
  if (uid === byUid) fail(400, 'You cannot suspend your own account');
  const ref = admin.collection().doc(uid);
  if (!(await ref.get()).exists) fail(404, 'Staff member not found');

  await ref.update({ status: 'suspended', suspendedAt: FieldValue.serverTimestamp() });
  await setLoginDisabled(uid, true);
  return { id: uid };
}

async function restore(uid) {
  const ref = admin.collection().doc(uid);
  if (!(await ref.get()).exists) fail(404, 'Staff member not found');

  await ref.update({ status: 'active', suspendedAt: null });
  await setLoginDisabled(uid, false);
  return { id: uid };
}

// Turns the Firebase login on or off. A login that is already gone is not an error.
async function setLoginDisabled(uid, disabled) {
  try {
    await auth.updateUser(uid, { disabled });
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
  }
}

module.exports = { list, create, remove, restore };

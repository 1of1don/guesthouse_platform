// A tiny in-memory stand-in for Firebase so the tests run with no internet and no credentials.
// It copies only the few methods this project uses. Call install() BEFORE requiring the app.
const path = require('node:path');

function makeDb() {
  const data = {}; // { collectionName: { docId: fields } }
  let counter = 0;
  const col = (name) => (data[name] ||= {});

  const snap = (name, id) => ({ id, exists: id in col(name), data: () => ({ ...col(name)[id] }), ref: docRef(name, id) });
  const docRef = (name, id) => ({
    id,
    get: async () => snap(name, id),
    set: async (d) => { col(name)[id] = { ...d }; },
    update: async (d) => { Object.assign(col(name)[id], d); },
    delete: async () => { delete col(name)[id]; },
  });
  const query = (name, filters = []) => ({
    where: (field, op, value) => query(name, [...filters, [field, value]]),
    get: async () => {
      const ids = Object.keys(col(name)).filter((id) => filters.every(([f, v]) => col(name)[id][f] === v));
      return { docs: ids.map((id) => snap(name, id)), size: ids.length };
    },
  });

  return {
    data,
    collection: (name) => ({
      doc: (id) => docRef(name, id || `auto${++counter}`),
      get: () => query(name).get(),
      where: (...args) => query(name).where(...args),
    }),
    runTransaction: async (fn) =>
      fn({ get: (ref) => ref.get(), update: (ref, d) => ref.update(d), delete: (ref) => ref.delete() }),
  };
}

// Fake logins: the token text decides who you are. "tok-super" is the user with uid "u-super", and so on.
function makeAuth(db) {
  const users = {};
  const disabled = {};
  return {
    verifyIdToken: async (token) => {
      if (!token.startsWith('tok-')) throw new Error('bad token');
      return { uid: `u-${token.slice(4)}` };
    },
    createUser: async ({ email }) => {
      if (users[email]) throw Object.assign(new Error('exists'), { code: 'auth/email-already-exists' });
      users[email] = { uid: `u-${email}` };
      return users[email];
    },
    updateUser: async (uid, changes) => { disabled[uid] = changes.disabled; },
    deleteUser: async () => {},
  };
}

function install() {
  const db = makeDb();
  const fake = { db, auth: makeAuth(db), FieldValue: { serverTimestamp: () => new Date().toISOString() } };
  const file = path.resolve(__dirname, '../server/config/firebase.js');
  require.cache[file] = { id: file, filename: file, loaded: true, exports: fake };

  // Three staff accounts. "customer" has a login but no staff record.
  const admins = db.data.admins = {};
  admins['u-super'] = { name: 'Sue', email: 'super@x.com', role: 'superadmin' };
  admins['u-admin'] = { name: 'Adam', email: 'admin@x.com', role: 'admin' };
  admins['u-mod'] = { name: 'Mo', email: 'mod@x.com', role: 'moderator' };
  return db;
}

module.exports = { install };

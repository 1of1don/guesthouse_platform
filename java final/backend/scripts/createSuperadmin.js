// Creates (or upgrades) the FIRST super admin. Run once after setting up .env:
//   npm run create-superadmin -- you@example.com "StrongPassword" "Your Name"
// If a login with that email already exists it is reused and the password argument is ignored.
require('dotenv').config();
const { auth, db, FieldValue } = require('../server/config/firebase');

async function main() {
  const [email, password, name = 'Owner'] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: npm run create-superadmin -- <email> <password> [name]');
    process.exit(1);
  }

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password, displayName: name });
  }

  await db.collection('admins').doc(user.uid).set(
    { name, email, role: 'superadmin', createdAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  console.log(`Super admin ready: ${email} (uid ${user.uid})`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });

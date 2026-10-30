//---Load environment variables from .env (Firebase credentials, etc.)
require('dotenv').config();

//---Pull in the pre-configured Admin SDK handles from the project's firebase config.
//--- Firebase Authentication admin API (create users, look them up)
//--- Firestore admin handle (read/write documents)
//--- sentinel helpers like serverTimestamp()
const { auth, db, FieldValue } = require('../server/config/firebase');

async function main() {
  //---Read CLI arguments passed after "--":
  //   1) email         (required)
  //   2) password      (required)
  //   3) name          (optional, defaults to "Owner")
  const [email, password, name = 'Owner'] = process.argv.slice(2);

  //---Guard: bail out early if the required args are missing.
  //---The comma trick lets us log the usage message AND exit in one line.
  if (!email || !password)
    return console.error('Usage: npm run create-superadmin -- <email> <password> [name]'), process.exit(1);

  //---Idempotent user creation:
  //---account and IGNORE the password argument
  const user = await auth.getUserByEmail(email)
    .catch(() => auth.createUser({ email, password, displayName: name }));

  //---Grant superadmin in Firestore:
  //---clock, not the developer's machine.
  await db.collection('admins').doc(user.uid).set(
    { name, email, role: 'superadmin', createdAt: FieldValue.serverTimestamp() },
    { merge: true },
  );

  //---Success log
  console.log(`Super admin ready: ${email} (uid ${user.uid})`);
}

//---Process lifecycle
main().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });
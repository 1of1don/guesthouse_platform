// Connects to Firebase using the service account from .env.
// Everything else imports { auth, db, FieldValue } from here, so this is the only file that
// knows how the connection is made.
const { initializeApp, cert, applicationDefault, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// FIREBASE_SERVICE_ACCOUNT (JSON text) wins; otherwise GOOGLE_APPLICATION_CREDENTIALS (file path) is used.
const credential = process.env.FIREBASE_SERVICE_ACCOUNT
  ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  : applicationDefault();

if (!getApps().length) {
  initializeApp({ credential, projectId: process.env.FIREBASE_PROJECT_ID });
}

module.exports = { auth: getAuth(), db: getFirestore(), FieldValue };

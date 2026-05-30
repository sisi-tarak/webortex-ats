/**
 * Firebase Admin SDK — server-side only.
 * Never import this in client components or pages that run in the browser.
 * Used exclusively in API routes and Server Actions.
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// ─── Singleton — never throws at module-load time ────────────────────────────
// Firebase Admin must NOT throw during `next build` (module initialization).
// All runtime validity checks happen inside individual API route handlers.
function getAdminApp() {
  if (getApps().length > 0) return getApps()[0]!;

  const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    // Missing creds — API routes will return 500 at runtime if adminDb is required.
    return null;
  }

  try {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  } catch {
    // Malformed/placeholder private key — gracefully return null.
    // A real PEM key must be set in production; API routes guard against null adminDb.
    return null;
  }
}

const adminApp = getAdminApp();

/** Firebase Admin Auth — verify ID tokens, manage users. */
export const adminAuth = adminApp ? getAuth(adminApp) : null;

/** Firebase Admin Firestore — server-side reads/writes bypass security rules. */
export const adminDb = adminApp ? getFirestore(adminApp) : null;

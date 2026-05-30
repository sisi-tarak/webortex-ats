import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Detect placeholder / missing credentials so we can suppress misleading errors
// during local development before a real Firebase project is configured.
const isConfigured =
  typeof firebaseConfig.apiKey === "string" &&
  firebaseConfig.apiKey.length > 0 &&
  !firebaseConfig.apiKey.startsWith("AIzaSyPlaceholder");

if (!isConfigured && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.warn(
    "[Firebase] Running with placeholder credentials.\n" +
      "Replace the values in .env.local with real Firebase project settings.\n" +
      "Authentication and Firestore will not work until this is done."
  );
}

// Initialize Firebase (singleton pattern — safe for Next.js hot reload)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics — browser-only, skip when using placeholder credentials
export const analytics =
  typeof window !== "undefined" && isConfigured
    ? import("firebase/analytics").then(({ getAnalytics, isSupported }) =>
        isSupported().then((yes) => (yes ? getAnalytics(app) : null))
      )
    : Promise.resolve(null);

// Connect to emulators in development (browser only)
if (
  typeof window !== "undefined" &&
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_USE_EMULATORS === "true"
) {
  Promise.all([
    import("firebase/auth"),
    import("firebase/firestore"),
    import("firebase/storage"),
  ]).then(
    ([
      { connectAuthEmulator },
      { connectFirestoreEmulator },
      { connectStorageEmulator },
    ]) => {
      try {
        connectAuthEmulator(auth, "http://localhost:9099", {
          disableWarnings: true,
        });
        connectFirestoreEmulator(db, "localhost", 8080);
        connectStorageEmulator(storage, "localhost", 9199);
      } catch {
        // Already connected — safe to ignore
      }
    }
  );
}

export default app;

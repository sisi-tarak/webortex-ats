import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ─── Google Sign In / Sign Up ─────────────────────────────────────────────────
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(result.user);
  return result.user;
}

// ─── Email / Password ─────────────────────────────────────────────────────────
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  // Refresh profile on login in case it doesn't exist yet (first-time email login
  // where the previous signup's ensureUserProfile failed)
  await ensureUserProfile(result.user).catch(() => {});
  return result.user;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  // Force token refresh so the next getIdToken() call includes the latest claims
  await result.user.getIdToken(/* forceRefresh */ true);
  await ensureUserProfile(result.user);
  return result.user;
}

// ─── Phone OTP (India-first) ──────────────────────────────────────────────────
export function initRecaptcha(containerId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {},
  });
}

export async function sendOTP(
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  const formatted = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
  return signInWithPhoneNumber(auth, formatted, recaptchaVerifier);
}

export async function verifyOTP(
  confirmationResult: ConfirmationResult,
  otp: string
): Promise<User> {
  const result = await confirmationResult.confirm(otp);
  await ensureUserProfile(result.user);
  return result.user;
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ─── Password Reset ───────────────────────────────────────────────────────────
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// ─── User Profile Bootstrapper ───────────────────────────────────────────────
/**
 * Ensures a Firestore user document exists for the given Firebase Auth user.
 *
 * Production path:  calls POST /api/user/ensure-profile — uses Admin SDK,
 *                   bypasses Firestore security rules entirely.
 *
 * Dev fallback:     if the API returns devMode:true (Admin SDK not configured),
 *                   writes directly via client Firestore SDK.
 */
async function ensureUserProfile(user: User): Promise<void> {
  try {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/user/ensure-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        displayName: user.displayName,
        email:       user.email,
        photoURL:    user.photoURL,
        phone:       user.phoneNumber,
      }),
    });

    if (!res.ok) {
      // Non-2xx → fall through to client-side fallback below
      throw new Error(`ensure-profile API returned ${res.status}`);
    }

    const data = (await res.json()) as { devMode?: boolean };
    if (!data.devMode) return; // Server handled it successfully
  } catch {
    // API call failed (no network, dev without Admin SDK, etc.) — fall through
  }

  // ── Dev / offline fallback — write directly via client Firestore SDK ──────
  // This path requires the Firestore security rules to be deployed.
  // In production, the API route above handles this — we never reach here.
  try {
    const userRef  = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid:           user.uid,
        email:         user.email,
        displayName:   user.displayName || "User",
        photoURL:      user.photoURL    || null,
        phone:         user.phoneNumber || null,
        plan:          "free",
        planExpiresAt: null,
        resumeCount:   0,
        createdAt:     serverTimestamp(),
        updatedAt:     serverTimestamp(),
      });
    }
  } catch {
    // Silently swallow — profile creation will be retried on next login
  }
}

export { PhoneAuthProvider };

/**
 * POST /api/user/ensure-profile
 *
 * Creates or refreshes the Firestore user document via Firebase Admin SDK.
 * Because Admin SDK bypasses security rules, this works even before
 * `firestore.rules` has been deployed — removing the client-side
 * "Missing or insufficient permissions" error on first login/signup.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/middleware/auth";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const bodySchema = z.object({
  displayName: z.string().optional().nullable(),
  email:       z.string().email().optional().nullable(),
  photoURL:    z.string().url().optional().nullable(),
  phone:       z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  // 1. Verify Firebase ID token
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const { uid } = auth;

  // 2. Parse optional body fields (client sends what it knows)
  const raw = await request.json().catch(() => ({}));
  const body = bodySchema.safeParse(raw).success
    ? bodySchema.parse(raw)
    : {};

  // 3. If Admin SDK is not configured (dev without service-account key),
  //    signal client to fall back to direct Firestore write.
  if (!adminDb) {
    return NextResponse.json({ success: true, devMode: true });
  }

  // 4. Fetch authoritative user data from Firebase Auth Admin
  let email     = body.email     ?? null;
  let photoURL  = body.photoURL  ?? null;
  let phone     = body.phone     ?? null;
  let displayName = body.displayName ?? null;

  if (adminAuth) {
    try {
      const record = await adminAuth.getUser(uid);
      email       = email       ?? record.email       ?? null;
      photoURL    = photoURL    ?? record.photoURL    ?? null;
      phone       = phone       ?? record.phoneNumber ?? null;
      displayName = displayName ?? record.displayName ?? null;
    } catch {
      // Non-fatal — use whatever the client sent
    }
  }

  const userRef  = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    // ── First-time user — create the profile document ─────────────────────
    await userRef.set({
      uid,
      email,
      displayName: displayName || "User",
      photoURL,
      phone,
      plan:           "free",
      planExpiresAt:  null,
      resumeCount:    0,
      createdAt:      FieldValue.serverTimestamp(),
      updatedAt:      FieldValue.serverTimestamp(),
    });
  } else {
    // ── Returning user — sync any changed Auth fields ─────────────────────
    const existing = userSnap.data() ?? {};
    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (photoURL   && existing.photoURL   !== photoURL)   updates.photoURL   = photoURL;
    if (displayName && !existing.displayName)              updates.displayName = displayName;
    if (email      && !existing.email)                    updates.email      = email;
    if (phone      && !existing.phone)                    updates.phone      = phone;

    // Only write if there's actually something to update
    if (Object.keys(updates).length > 1) {
      await userRef.update(updates);
    }
  }

  return NextResponse.json({ success: true });
}

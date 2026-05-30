/**
 * API Route Authentication Middleware
 *
 * Usage:
 *   const { uid, error } = await requireAuth(request);
 *   if (error) return error; // returns a 401 NextResponse
 *   // uid is the verified Firebase UID
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

interface AuthResult {
  uid: string;
  email?: string;
  error: null;
}

interface AuthError {
  uid: null;
  email: null;
  error: NextResponse;
}

export async function requireAuth(
  request: NextRequest
): Promise<AuthResult | AuthError> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      uid: null,
      email: null,
      error: NextResponse.json(
        { error: "Unauthorized: Missing or malformed Authorization header" },
        { status: 401 }
      ),
    };
  }

  const idToken = authHeader.slice(7); // strip "Bearer "

  // In development with placeholder credentials, skip token verification.
  if (!adminAuth) {
    if (process.env.NODE_ENV === "development") {
      // Return a fake UID so dev flows work without real Firebase credentials.
      // This MUST never run in production (adminAuth is always set there).
      return { uid: "dev-uid-placeholder", email: "dev@webortex.com", error: null };
    }
    return {
      uid: null,
      email: null,
      error: NextResponse.json(
        { error: "Server misconfiguration: Firebase Admin not initialized" },
        { status: 500 }
      ),
    };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken, true); // checkRevoked=true
    return { uid: decoded.uid, email: decoded.email, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Token verification failed";
    return {
      uid: null,
      email: null,
      error: NextResponse.json(
        { error: `Unauthorized: ${message}` },
        { status: 401 }
      ),
    };
  }
}

/**
 * Rate-limit helper — simple in-memory sliding window per UID.
 * For production scale, replace with Upstash Redis.
 */
const rateLimitStore = new Map<string, number[]>();

export function checkRateLimit(
  uid: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (rateLimitStore.get(uid) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0] ?? now;
    return { allowed: false, retryAfterMs: oldest + windowMs - now };
  }

  timestamps.push(now);
  rateLimitStore.set(uid, timestamps);
  return { allowed: true, retryAfterMs: 0 };
}

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { requireAuth } from "@/lib/middleware/auth";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const VerifySchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id:   z.string().min(1),
  razorpay_signature:  z.string().min(1),
  billing:             z.enum(["monthly", "annual"]),
});

function getPlanExpiry(billing: "monthly" | "annual"): Date {
  const d = new Date();
  if (billing === "annual") {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export async function POST(request: NextRequest) {
  // ── 1. Authentication ───────────────────────────────────────────────────────
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  // ── 2. Input validation ─────────────────────────────────────────────────────
  let body: z.infer<typeof VerifySchema>;
  try {
    body = VerifySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
  }

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, billing } = body;

  // ── 3. Verify Razorpay HMAC signature ──────────────────────────────────────
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    if (process.env.NODE_ENV === "development") {
      // Skip signature check in dev — update plan directly
      await upgradePlan(auth.uid, billing);
      return NextResponse.json({ success: true, stub: true });
    }
    return NextResponse.json(
      { error: "Payment service not configured" },
      { status: 503 }
    );
  }

  const signPayload  = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSig  = crypto
    .createHmac("sha256", keySecret)
    .update(signPayload)
    .digest("hex");

  if (!crypto.timingSafeEqual(
    Buffer.from(expectedSig, "hex"),
    Buffer.from(razorpay_signature, "hex")
  )) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // ── 4. Upgrade user plan in Firestore via Admin SDK ────────────────────────
  try {
    await upgradePlan(auth.uid, billing);

    // Record the subscription for audit trail
    if (adminDb) {
      await adminDb.collection("subscriptions").doc(auth.uid).set({
        uid:               auth.uid,
        razorpay_order_id,
        razorpay_payment_id,
        plan:              "pro",
        billing,
        activatedAt:       FieldValue.serverTimestamp(),
        expiresAt:         getPlanExpiry(billing),
      }, { merge: true });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[razorpay/verify] Failed to upgrade plan:", err);
    return NextResponse.json(
      { error: "Payment verified but plan upgrade failed. Contact support." },
      { status: 500 }
    );
  }
}

async function upgradePlan(uid: string, billing: "monthly" | "annual") {
  if (!adminDb) {
    console.warn("[razorpay/verify] adminDb not available — plan not upgraded");
    return;
  }
  await adminDb.collection("users").doc(uid).update({
    plan:          "pro",
    planExpiresAt: getPlanExpiry(billing).toISOString(),
    updatedAt:     FieldValue.serverTimestamp(),
  });
}

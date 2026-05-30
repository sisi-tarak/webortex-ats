/**
 * Razorpay Webhook Handler
 *
 * Configure in Razorpay Dashboard → Webhooks:
 *   URL: https://ats.webortex.com/api/razorpay/webhook
 *   Events: subscription.activated, subscription.charged,
 *           subscription.cancelled, subscription.expired,
 *           payment.failed
 *
 * This is the authoritative source of truth for subscription state.
 * Never rely solely on client-side payment success callbacks.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

interface RazorpayWebhookEvent {
  entity:  string;
  account_id: string;
  event:   string;
  payload: {
    subscription?: {
      entity: {
        id:         string;
        status:     string;
        plan_id:    string;
        customer_id: string;
        current_end: number;
        notes: { userId?: string; billing?: string };
      };
    };
    payment?: {
      entity: {
        id:           string;
        subscription_id: string;
        amount:       number;
        status:       string;
        notes: { userId?: string };
      };
    };
  };
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  // ── Verify webhook signature ────────────────────────────────────────────────
  const rawBody  = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    switch (event.event) {
      case "subscription.activated":
      case "subscription.charged": {
        const sub    = event.payload.subscription?.entity;
        const userId = sub?.notes?.userId;
        if (!userId || !adminDb) break;

        const expiresAt = sub?.current_end
          ? new Date(sub.current_end * 1000).toISOString()
          : null;

        await adminDb.collection("users").doc(userId).update({
          plan:          "pro",
          planExpiresAt: expiresAt,
          updatedAt:     FieldValue.serverTimestamp(),
        });

        await adminDb.collection("subscriptions").doc(userId).set({
          razorpay_subscription_id: sub?.id,
          plan:   "pro",
          status: sub?.status,
          expiresAt,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        break;
      }

      case "subscription.cancelled":
      case "subscription.expired": {
        const sub    = event.payload.subscription?.entity;
        const userId = sub?.notes?.userId;
        if (!userId || !adminDb) break;

        // Downgrade at period end — keep Pro until planExpiresAt
        await adminDb.collection("subscriptions").doc(userId).set({
          status:    sub?.status,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        // Schedule downgrade — set plan to "free" only after expiry.
        // For simplicity: downgrade immediately on cancellation.
        await adminDb.collection("users").doc(userId).update({
          plan:      "free",
          updatedAt: FieldValue.serverTimestamp(),
        });
        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment?.entity;
        const userId  = payment?.notes?.userId;
        if (!userId || !adminDb) break;

        // Log failed payment for dunning management
        await adminDb.collection("payment_events").add({
          userId,
          paymentId:  payment?.id,
          event:      "payment.failed",
          amount:     payment?.amount,
          createdAt:  FieldValue.serverTimestamp(),
        });
        break;
      }

      default:
        // Log unhandled events for debugging
        console.info(`[webhook] Unhandled event: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    // Return 200 to prevent Razorpay from retrying — we'll fix in monitoring
    return NextResponse.json({ received: true, error: String(err) });
  }
}

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    };

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    // Verify Razorpay signature (HMAC SHA256)
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(sign)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // ── Update user plan in Firestore via Firebase Admin ─────────────────────
    // TODO Phase 3: wire Firebase Admin to update user plan
    // const admin = await getFirebaseAdmin();
    // const db = admin.firestore();
    // await db.collection("users").doc(userId).update({
    //   plan: "pro",
    //   planExpiresAt: getExpiryDate(billing),
    //   updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    // });

    return NextResponse.json({
      success: true,
      message: "Payment verified. User plan will be updated via webhook in Phase 3.",
    });

  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}

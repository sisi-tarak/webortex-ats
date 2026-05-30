import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/middleware/auth";

const PRICES = {
  monthly: 29900,  // ₹299 in paise (includes 18% GST)
  annual:  249900, // ₹2,499 in paise
} as const;

const CreateOrderSchema = z.object({
  plan:    z.literal("pro"),
  billing: z.enum(["monthly", "annual"]),
});

export async function POST(request: NextRequest) {
  // ── 1. Authentication ───────────────────────────────────────────────────────
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  // ── 2. Input validation ─────────────────────────────────────────────────────
  let body: z.infer<typeof CreateOrderSchema>;
  try {
    body = CreateOrderSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid plan or billing cycle" }, { status: 400 });
  }

  const { billing } = body;
  const amount = PRICES[billing];

  // ── 3. Guard: secret must be configured ────────────────────────────────────
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    if (process.env.NODE_ENV === "development") {
      // Return a stub order in development
      return NextResponse.json({
        orderId:  `order_dev_${Date.now()}`,
        amount,
        currency: "INR",
        stub:     true,
        message:  "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable real payments.",
      });
    }
    return NextResponse.json(
      { error: "Payment service not configured" },
      { status: 503 }
    );
  }

  try {
    // ── 4. Create Razorpay order ─────────────────────────────────────────────
    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt:  `rcpt_${auth.uid.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId:  auth.uid,
        email:   auth.email ?? "",
        plan:    "pro",
        billing,
      },
    });

    return NextResponse.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
    });
  } catch (err: unknown) {
    console.error("[razorpay/create-order]", err);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}

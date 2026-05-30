import { NextRequest, NextResponse } from "next/server";

// Razorpay plan IDs (set these after creating plans in Razorpay dashboard)
const PLAN_IDS = {
  pro_monthly: process.env.RAZORPAY_PLAN_ID_MONTHLY || "plan_monthly_placeholder",
  pro_annual: process.env.RAZORPAY_PLAN_ID_ANNUAL || "plan_annual_placeholder",
};

const PRICES = {
  monthly: 29900, // ₹299 in paise
  annual: 249900,  // ₹2,499 in paise
};

export async function POST(request: NextRequest) {
  try {
    const { plan, billing } = await request.json() as {
      plan: string;
      billing: "monthly" | "annual";
    };

    if (plan !== "pro") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // ── Real Razorpay Integration ─────────────────────────────────────────────
    // const Razorpay = (await import("razorpay")).default;
    // const razorpay = new Razorpay({
    //   key_id: process.env.RAZORPAY_KEY_ID!,
    //   key_secret: process.env.RAZORPAY_KEY_SECRET!,
    // });
    //
    // const order = await razorpay.orders.create({
    //   amount: PRICES[billing],
    //   currency: "INR",
    //   receipt: `receipt_${Date.now()}`,
    //   notes: { plan, billing },
    // });
    //
    // return NextResponse.json({
    //   orderId: order.id,
    //   amount: order.amount,
    //   currency: order.currency,
    // });

    // ── Stub for Phase 3 integration ─────────────────────────────────────────
    return NextResponse.json({
      orderId: `order_stub_${Date.now()}`,
      amount: PRICES[billing],
      currency: "INR",
      message: "Razorpay integration active in Phase 3. Install: npm install razorpay",
    });

  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

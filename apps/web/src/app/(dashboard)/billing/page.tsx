"use client";

import { useState } from "react";
import { Crown, CheckCircle2, Zap, ChevronRight, Shield, Receipt, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const FREE_FEATURES = [
  "1 resume",
  "1 ATS template",
  "2 ATS score checks/month",
  "Watermarked PDF export",
  "Basic keyword suggestions",
];

const PRO_FEATURES = [
  "Unlimited resumes & versions",
  "All 10+ premium templates",
  "Unlimited ATS score checks",
  "Clean PDF downloads (no watermark)",
  "AI bullet point optimizer",
  "Job description keyword matching",
  "Resume version history",
  "Cover letter generator",
  "Priority email support",
  "GST invoice for expense claims",
];

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function BillingPage() {
  const { profile, isPro } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);

  const price = billing === "monthly" ? 299 : 2499;
  const priceDisplay = billing === "monthly" ? "₹299/month" : "₹2,499/year";
  const saving = billing === "annual" ? "Save ₹1,089" : null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // Load Razorpay script dynamically
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Razorpay"));
        document.head.appendChild(script);
      });

      // Create order via API
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro", billing }),
      });

      if (!res.ok) throw new Error("Failed to create order");
      const { orderId, amount, currency } = await res.json();

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        order_id: orderId,
        name: "Webortex ATS Resume",
        description: `Pro Plan — ${billing === "monthly" ? "Monthly" : "Annual"}`,
        image: "/logo.png",
        prefill: {
          name: profile?.displayName,
          email: profile?.email,
          contact: profile?.phone,
        },
        theme: { color: "#62ba47" },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // Verify payment
          await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          toast.success("Payment successful! Welcome to Pro! 🎉");
          window.location.reload();
        },
      });

      razorpay.open();
    } catch {
      toast.error("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isPro) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Billing & Subscription</h1>
        </div>

        <Card className="border-2 border-[var(--primary)] mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-[#62ba47]/10">
                <Crown className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-[var(--foreground)]">Pro Plan — Active</h2>
                  <Badge variant="pro">Active</Badge>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Your plan renews on{" "}
                  {profile?.planExpiresAt
                    ? new Date(profile.planExpiresAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
                    : "—"}
                </p>
              </div>
              <Button variant="outline" size="sm">Manage Subscription</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4 text-[var(--primary)]" /> Billing History</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--muted-foreground)]">Your invoices will appear here. GST-compliant invoices auto-generated.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><HelpCircle className="h-4 w-4 text-[var(--primary)]" /> Need Help?</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--muted-foreground)] mb-3">Questions about your subscription?</p>
              <Button variant="outline" size="sm">Contact Support</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8 text-center">
        <Crown className="h-10 w-10 text-[#62ba47] mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Upgrade to Pro</h1>
        <p className="text-[var(--muted-foreground)]">
          Unlock unlimited resumes, AI features, and clean PDF downloads
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <button
          onClick={() => setBilling("monthly")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billing === "monthly" ? "bg-[var(--primary)] text-[#060606] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling("annual")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${billing === "annual" ? "bg-[var(--primary)] text-[#060606] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
        >
          Annual
          <Badge className="bg-[#62ba47]/20 text-[#62ba47] text-[10px]">Save 30%</Badge>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Free */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">Free</h3>
            <div className="text-4xl font-black font-mono text-[var(--foreground)] mb-4">₹0</div>
            <ul className="space-y-2.5 mb-6">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--muted-foreground)]">
                  <CheckCircle2 className="h-4 w-4 text-[var(--muted-foreground)] flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" size="lg" className="w-full" disabled>
              Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="border-2 border-[var(--primary)] relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-[#62ba47] text-[#060606] font-bold px-4 py-1">Most Popular</Badge>
          </div>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">Pro</h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-black font-mono text-[var(--primary)]">
                {billing === "monthly" ? "₹299" : "₹2,499"}
              </span>
              <span className="text-sm text-[var(--muted-foreground)]">
                {billing === "monthly" ? "/month" : "/year"}
              </span>
            </div>
            {saving && <p className="text-xs text-[#62ba47] font-medium mb-4">{saving}</p>}
            {!saving && <div className="mb-4" />}
            <ul className="space-y-2.5 mb-6">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--foreground)]">
                  <CheckCircle2 className="h-4 w-4 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant="premium"
              size="lg"
              className="w-full"
              onClick={handleUpgrade}
              loading={loading}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              <Zap className="h-4 w-4" />
              Upgrade Now — {priceDisplay}
            </Button>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                <Shield className="h-3.5 w-3.5" />
                UPI, Cards, EMI
              </div>
              <div className="text-[var(--muted-foreground)]">·</div>
              <div className="text-xs text-[var(--muted-foreground)]">Cancel anytime</div>
              <div className="text-[var(--muted-foreground)]">·</div>
              <div className="text-xs text-[var(--muted-foreground)]">GST invoice</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-[var(--muted-foreground)]">
        Payments secured by Razorpay. GST-compliant invoices generated automatically.
        All amounts in INR including 18% GST.
      </p>
    </div>
  );
}

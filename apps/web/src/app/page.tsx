import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  Target,
  TrendingUp,
  Shield,
  Star,
  ChevronRight,
  BarChart3,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
// ClientNavbar: ssr:false wrapper keeps Firebase out of the SSG pre-render
import { ClientNavbar } from "@/components/layout/ClientNavbar";

// Force dynamic — Firebase-dependent root layout must not be statically pre-rendered
export const dynamic = "force-dynamic";

/* ── Data ──────────────────────────────────────────────────────────────────── */

const STATS = [
  { value: "98%",  label: "Fortune 500 companies use ATS" },
  { value: "75%",  label: "of resumes rejected before human review" },
  { value: "3×",   label: "more interviews with ATS-optimized resume" },
  { value: "340%", label: "growth in ATS resume searches since 2021" },
];

const FEATURES = [
  {
    icon: FileText,
    title: "LaTeX-Powered Precision",
    description:
      "Every resume is compiled using LaTeX — the gold standard for document formatting. Produces the cleanest PDF structure that ATS parsers love.",
    badge: "Core Technology",
    accent: "#62ba47",   // green
  },
  {
    icon: BarChart3,
    title: "Real-Time ATS Score",
    description:
      "Get a detailed ATS score broken down by keywords, formatting, sections, quantitative impact, and contact completeness. Fix issues before you apply.",
    badge: "ATS Intelligence",
    accent: "#009dda",   // blue
  },
  {
    icon: Target,
    title: "Job Description Matching",
    description:
      "Paste any job description. See exactly which keywords your resume is missing and where to add them for maximum ATS pass-through.",
    badge: "Keyword Engine",
    accent: "#62ba47",
  },
  {
    icon: Sparkles,
    title: "AI Bullet Optimizer",
    description:
      "Weak bullet points kill ATS scores. Our AI rewrites them to be quantified, action-oriented, and keyword-rich. One click.",
    badge: "AI-Powered",
    accent: "#009dda",
  },
  {
    icon: TrendingUp,
    title: "Quantitative Impact Scoring",
    description:
      "ATS systems and recruiters reward numbers. We detect every bullet without metrics and prompt you to add them — boosting your score and recruiter appeal.",
    badge: "Pro Feature",
    accent: "#62ba47",
  },
  {
    icon: Shield,
    title: "Format-Proof Output",
    description:
      "Single-column layout, standard fonts, no tables or images. LaTeX guarantees clean text extraction — exactly what ATS parsers need.",
    badge: "ATS Safe",
    accent: "#009dda",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Fill Your Details",     description: "Enter your experience, education, and skills through our guided form. No LaTeX knowledge needed — we handle the code." },
  { step: "02", title: "See Live Preview",      description: "Watch your ATS-optimized resume compile in real-time on the right panel. Change templates, fonts, and sections instantly." },
  { step: "03", title: "Check Your ATS Score",  description: "Paste a job description. Get a detailed score with specific fixes. Our AI helps you improve weak points before you apply." },
  { step: "04", title: "Download & Apply",      description: "Export a clean, ATS-proof PDF. Apply with confidence knowing your resume is machine-ready." },
];

const TESTIMONIALS = [
  {
    name: "Priya S.",     role: "Software Engineer at Google",
    content: "I applied to 40+ companies with zero callbacks. After using this platform and fixing my ATS score from 34% to 89%, I got 8 interview calls in 2 weeks.",
    score: { before: 34, after: 89 },
  },
  {
    name: "Arjun M.",     role: "Product Manager at Razorpay",
    content: "The job description matching feature is a game-changer. It showed me I was missing 12 critical keywords the JD required. Fixed it, got shortlisted.",
    score: { before: 51, after: 92 },
  },
  {
    name: "Divya K.",     role: "Data Scientist at Flipkart",
    content: "The AI bullet point optimizer alone is worth the subscription. My resume went from 'managed data' to 'built ML pipeline processing 2M events/day, reducing latency by 40%'.",
    score: { before: 47, after: 88 },
  },
];

const PRICING = [
  {
    name: "Free", price: "₹0", period: "forever",
    description: "For trying it out",
    features: ["1 resume", "1 ATS template", "2 ATS score checks/month", "Watermarked PDF export", "Basic keyword suggestions"],
    cta: "Start Free", href: "/signup", highlighted: false,
  },
  {
    name: "Pro", price: "₹299", period: "/month",
    annualPrice: "₹2,499/year (save ₹1,089)",
    description: "For serious job seekers",
    features: ["Unlimited resumes & versions", "All 10+ premium templates", "Unlimited ATS checks", "Clean PDF downloads", "AI bullet point optimizer", "Job description keyword matching", "Resume version history", "Priority support"],
    cta: "Start Pro Free Trial", href: "/signup?plan=pro", highlighted: true,
  },
];

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    /* Dark base — backgroundColor #060606 */
    <div className="min-h-screen bg-[#060606]">
      <ClientNavbar />

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#060606] pt-20 pb-32">
        {/* Decorative glow blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#62ba47]/8 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#009dda]/8 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge — blue tinted outline on dark bg */}
          <Badge
            variant="outline"
            className="mb-6 px-4 py-1.5 text-sm border-[#009dda]/40 text-[#009dda] bg-[#009dda]/8"
          >
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            India&apos;s First LaTeX-Powered ATS Resume Builder
          </Badge>

          {/* Headline — light text on dark bg (#efefef) */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-[#efefef] leading-tight tracking-tight mb-6">
            The Resume That
            <br />
            {/* Green → blue gradient text */}
            <span className="gradient-text">Beats Every ATS Scanner</span>
          </h1>

          {/* Sub-text — coverMainTextColor (#c5c5c5) */}
          <p className="max-w-2xl mx-auto text-xl text-[#c5c5c5] leading-relaxed mb-10">
            75% of resumes never reach a human. We build yours with LaTeX precision and
            real-time ATS scoring to guarantee yours gets through — every time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {/* Primary CTA — green bg, dark text */}
            <Button size="xl" asChild>
              <Link href="/signup">
                Build My ATS Resume Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            {/* Secondary CTA — outlined, light text */}
            <Button variant="outline" size="xl" asChild>
              <Link href="/dashboard/ats-checker">
                <BarChart3 className="h-5 w-5" />
                Check My ATS Score
              </Link>
            </Button>
          </div>

          <p className="text-sm text-[#a0a0a0]">
            Free to start · No credit card required · UPI payments supported
          </p>

          {/* Score Before/After showcase — card bg #222222 */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="bg-[#222222] rounded-2xl border border-[#3b3b3b] shadow-2xl shadow-black/50 p-8">
              <p className="text-sm text-[#a0a0a0] mb-6 font-medium uppercase tracking-wider">Real user result</p>
              <div className="flex items-center justify-between gap-6">
                <div className="text-center">
                  <div className="text-5xl font-black text-red-400 font-mono">34%</div>
                  <div className="text-sm text-[#a0a0a0] mt-1">Before</div>
                  <div className="text-xs text-[#a0a0a0]">0 callbacks</div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full h-2 bg-[#3b3b3b] rounded-full overflow-hidden">
                    {/* Green → blue progress */}
                    <div className="h-full bg-gradient-to-r from-[#62ba47] to-[#009dda] rounded-full" style={{ width: "89%" }} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#a0a0a0]">
                    <Sparkles className="h-3.5 w-3.5 text-[#62ba47]" />
                    ATS Optimized in 15 minutes
                    <Sparkles className="h-3.5 w-3.5 text-[#62ba47]" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-black text-[#62ba47] font-mono">89%</div>
                  <div className="text-sm text-[#a0a0a0] mt-1">After</div>
                  <div className="text-xs text-[#a0a0a0]">8 callbacks</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      {/* Alternate dark surface — brandsBgColor #222222 */}
      <section className="py-16 bg-[#222222] border-y border-[#3b3b3b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.value} className="text-center">
                {/* Stat value — brand green */}
                <div className="text-3xl sm:text-4xl font-black text-[#62ba47] mb-2 font-mono">
                  {stat.value}
                </div>
                {/* Stat label — secondary text (#a0a0a0) on #222222 bg */}
                <div className="text-sm text-[#a0a0a0] leading-snug">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#060606]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="mb-4 text-sm border-[#62ba47]/40 text-[#62ba47] bg-[#62ba47]/8"
            >
              Everything You Need
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#efefef] mb-4">
              Built specifically to beat ATS systems
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-[#a0a0a0]">
              Every feature is designed around one goal: getting your resume past the
              machine and in front of the human.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-[#3b3b3b] bg-[#222222] p-6 hover:border-[#62ba47]/40 hover:shadow-lg hover:shadow-black/30 transition-all group"
              >
                {/* Icon — accent-colored on dark surface */}
                <div
                  className="inline-flex p-2.5 rounded-lg mb-4"
                  style={{ backgroundColor: `${feature.accent}15`, border: `1px solid ${feature.accent}30` }}
                >
                  <feature.icon className="h-5 w-5" style={{ color: feature.accent }} />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs mb-3 font-mono border-[#3b3b3b] text-[#a0a0a0]"
                >
                  {feature.badge}
                </Badge>
                {/* Heading — light text (#efefef) on dark card (#222222) */}
                <h3 className="text-lg font-semibold text-[#efefef] mb-2">{feature.title}</h3>
                {/* Body — secondary text (#a0a0a0) */}
                <p className="text-sm text-[#a0a0a0] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#222222] border-y border-[#3b3b3b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#efefef] mb-4">
              From zero to ATS-ready in 15 minutes
            </h2>
            <p className="text-lg text-[#a0a0a0]">No LaTeX knowledge needed. Just fill, score, and apply.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-6 h-0.5 bg-gradient-to-r from-[#62ba47]/40 to-[#3b3b3b] z-0"
                    style={{ width: "calc(100% - 3rem)", left: "calc(50% + 1.5rem)" }}
                  />
                )}
                <div className="relative text-center">
                  {/* Step number — green circle, dark text (#060606) */}
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#62ba47] text-[#060606] font-bold text-lg mb-4 shadow-lg shadow-[#62ba47]/25">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-bold text-[#efefef] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#a0a0a0] leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#060606]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#efefef] mb-4">
              Real results from real job seekers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-[#3b3b3b] bg-[#222222] p-6 hover:border-[#62ba47]/30 hover:shadow-md hover:shadow-black/30 transition-all"
              >
                {/* Stars — amber, visible on dark bg */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Score pill */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-[#3b3b3b] rounded-lg">
                  <span className="text-xl font-black text-red-400 font-mono">{t.score.before}%</span>
                  <ArrowRight className="h-4 w-4 text-[#a0a0a0]" />
                  <span className="text-xl font-black text-[#62ba47] font-mono">{t.score.after}%</span>
                  <span className="text-xs text-[#a0a0a0] ml-auto">ATS Score</span>
                </div>

                {/* Quote — cover text color (#c5c5c5) */}
                <p className="text-sm text-[#c5c5c5] leading-relaxed mb-4 italic">
                  &quot;{t.content}&quot;
                </p>
                <div>
                  <p className="text-sm font-semibold text-[#efefef]">{t.name}</p>
                  <p className="text-xs text-[#a0a0a0]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-[#222222] border-y border-[#3b3b3b]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#efefef] mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-[#a0a0a0]">
              Start free. Upgrade when you&apos;re ready. UPI, Cards, and Netbanking accepted.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.highlighted
                    /* Pro plan — green border glow, dark bg elevated */
                    ? "rounded-2xl p-8 bg-[#060606] border-2 border-[#62ba47] relative shadow-2xl shadow-[#62ba47]/15"
                    /* Free plan — standard dark card */
                    : "rounded-2xl p-8 bg-[#060606] border border-[#3b3b3b]"
                }
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#62ba47] text-[#060606] font-bold px-4">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-[#efefef] mb-1">{plan.name}</h3>
                  <p className="text-sm text-[#a0a0a0]">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-5xl font-black font-mono text-[#efefef]">{plan.price}</span>
                  <span className="text-sm ml-1 text-[#a0a0a0]">{plan.period}</span>
                  {plan.annualPrice && (
                    <p className="text-sm mt-1 text-[#62ba47]">or {plan.annualPrice}</p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#62ba47]" />
                      <span className="text-sm text-[#c5c5c5]">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.highlighted ? "default" : "outline"}
                  size="lg"
                  className="w-full"
                  asChild
                >
                  <Link href={plan.href}>
                    {plan.cta}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-[#a0a0a0] mt-8">
            GST invoices provided · Cancel anytime · Secure payments via Razorpay
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────────────── */}
      {/* Green → blue gradient — light text on coloured bg */}
      <section className="py-24 bg-gradient-to-r from-[#62ba47] to-[#009dda]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Dark text on green/blue gradient — backgroundColor (#060606) as text */}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#060606] mb-6">
            Your next interview is one ATS score away
          </h2>
          <p className="text-xl text-[#060606]/75 mb-10 max-w-2xl mx-auto">
            Join thousands of Indian job seekers who upgraded their resume and got more callbacks.
          </p>
          {/* On the green bg — use an inverted button (dark bg, light text) */}
          <Button
            size="xl"
            className="bg-[#060606] text-[#efefef] hover:bg-[#1a1a1a] shadow-lg"
            asChild
          >
            <Link href="/signup">
              Build My Resume Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <p className="text-[#060606]/60 text-sm mt-4">
            No credit card · UPI supported · Takes 15 minutes
          </p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      {/* Near-black footer — backgroundColor #060606, top border */}
      <footer className="bg-[#060606] border-t border-[#3b3b3b] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              {/* Logo */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#62ba47] text-[#060606] font-bold text-sm">
                  ATS
                </div>
                <span className="font-bold text-[#efefef]">Webortex ATS Resume</span>
              </div>
              <p className="text-[#a0a0a0] text-sm leading-relaxed max-w-sm">
                The only ATS resume builder powered by LaTeX. Built for Indian job seekers.
                Get your score. Fix it. Get hired.
              </p>
            </div>

            <div>
              <h4 className="text-[#efefef] font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2">
                {["Features", "Templates", "ATS Checker", "Pricing"].map((item) => (
                  <li key={item}>
                    <Link
                      href={`/${item.toLowerCase().replace(" ", "-")}`}
                      className="text-[#a0a0a0] text-sm hover:text-[#62ba47] transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[#efefef] font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2">
                {["About", "Blog", "Privacy Policy", "Terms of Service"].map((item) => (
                  <li key={item}>
                    <Link
                      href={`/${item.toLowerCase().replace(/ /g, "-")}`}
                      className="text-[#a0a0a0] text-sm hover:text-[#62ba47] transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-[#3b3b3b] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[#a0a0a0] text-sm">
              © 2026 Webortex. All rights reserved. Built in India 🇮🇳
            </p>
            <p className="text-[#3b3b3b] text-xs font-mono">
              ATS Score disclaimer: Our score is based on industry-standard rules, not affiliated with any specific ATS vendor.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

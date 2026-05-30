import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel ─────────────────────────────────────────── */}
      {/*  Dark bg (#060606) with green accent elements                     */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#060606] flex-col justify-between p-12 relative overflow-hidden border-r border-[#3b3b3b]">

        {/* Decorative glow blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#62ba47]/8 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#009dda]/8 blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Back link — white text, green hover */}
        <Link
          href="/"
          className="relative flex items-center gap-2 text-[#a0a0a0] hover:text-[#62ba47] transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        {/* Main content */}
        <div className="relative">
          {/* Logo mark */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#62ba47] text-[#060606] font-black text-sm">
              ATS
            </div>
            <span className="text-[#efefef] font-bold text-lg">Webortex ATS Resume</span>
          </div>

          <h2 className="text-4xl font-extrabold text-[#efefef] leading-tight mb-6">
            Build resumes that
            <br />
            {/* Green → blue gradient text */}
            <span className="gradient-text">beat every ATS</span>
          </h2>

          {/* Feature checklist */}
          <div className="space-y-4">
            {[
              "LaTeX-precision PDF output",
              "Real-time ATS score checking",
              "AI bullet point optimizer",
              "Job description keyword matching",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                {/* Green checkmark circle */}
                <div className="w-5 h-5 rounded-full bg-[#62ba47]/20 border border-[#62ba47]/40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#62ba47]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-[#c5c5c5]">{item}</span>
              </div>
            ))}
          </div>

          {/* Score showcase card — dark card surface */}
          <div className="mt-10 p-5 bg-[#222222] rounded-xl border border-[#3b3b3b]">
            <div className="flex gap-4 items-center mb-3">
              <div className="text-center">
                <div className="text-2xl font-black text-red-400 font-mono">34%</div>
                <div className="text-xs text-[#a0a0a0]">Before</div>
              </div>
              <div className="flex-1 h-1.5 bg-[#3b3b3b] rounded-full overflow-hidden">
                {/* Green progress fill */}
                <div className="h-full bg-gradient-to-r from-[#62ba47] to-[#009dda] rounded-full" style={{ width: "89%" }} />
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-[#62ba47] font-mono">89%</div>
                <div className="text-xs text-[#a0a0a0]">After</div>
              </div>
            </div>
            <p className="text-xs text-[#a0a0a0] italic">
              &quot;Got 8 interview calls in 2 weeks after optimizing my ATS score.&quot; — Priya S., SWE @ Google
            </p>
          </div>
        </div>

        <p className="relative text-[#a0a0a0] text-xs">
          © 2026 Webortex · India-first · UPI payments supported
        </p>
      </div>

      {/* ── Right form panel ────────────────────────────────────────────── */}
      {/* Dark bg (#060606) — dark text would be invisible; use foreground (#efefef) */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#060606]">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

    </div>
  );
}

"use client";

import { useState } from "react";
import { Lock, Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const TEMPLATES = [
  { id: "classic-tech", name: "Classic Tech", category: "tech", isPremium: false, gradient: "from-blue-500 to-blue-700", desc: "Clean, ATS-safe. Preferred by FAANG & startups.", tags: ["ATS Safe", "Single Column"] },
  { id: "modern-minimal", name: "Modern Minimal", category: "business", isPremium: false, gradient: "from-slate-600 to-slate-800", desc: "Minimalist with subtle accent lines. All industries.", tags: ["ATS Safe", "Single Column"] },
  { id: "executive-clean", name: "Executive Clean", category: "business", isPremium: true, gradient: "from-indigo-600 to-purple-700", desc: "Senior roles. Strong section hierarchy.", tags: ["ATS Safe", "Premium"] },
  { id: "data-science", name: "Data Science Pro", category: "tech", isPremium: true, gradient: "from-emerald-500 to-teal-700", desc: "Optimized for data & ML roles.", tags: ["ATS Safe", "Skills Matrix"] },
  { id: "product-manager", name: "Product Manager", category: "business", isPremium: true, gradient: "from-rose-500 to-pink-700", desc: "Highlights impact & leadership. PM-optimized.", tags: ["ATS Safe", "Impact Focus"] },
  { id: "academic-research", name: "Academic Research", category: "academic", isPremium: true, gradient: "from-amber-600 to-orange-700", desc: "For research & academia. Publications section.", tags: ["ATS Safe", "Publications"] },
];

const CATEGORIES = ["all", "tech", "business", "academic"];

export default function TemplatesPage() {
  const { isPro } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.category === filter);

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Resume Templates</h1>
        <p className="text-[var(--muted-foreground)]">
          All templates are LaTeX-compiled and fully ATS-safe. Choose your style.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
              filter === cat
                ? "bg-[var(--primary)] text-[#060606]"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)]"
            }`}
          >
            {cat === "all" ? "All Templates" : cat}
          </button>
        ))}
      </div>

      {!isPro && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#62ba47]/10 to-[#009dda]/10 border border-[#62ba47]/25 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-[var(--foreground)] text-sm">Unlock all 6+ premium templates</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Pro plan includes unlimited templates + AI features</p>
          </div>
          <Button variant="premium" size="sm" onClick={() => router.push("/dashboard/billing")}>
            Upgrade to Pro
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((tpl) => {
          const locked = tpl.isPremium && !isPro;
          return (
            <Card key={tpl.id} hover className="overflow-hidden group">
              <div className={`h-48 bg-gradient-to-br ${tpl.gradient} flex items-center justify-center relative`}>
                {/* PDF mockup */}
                <div className="w-24 h-32 bg-white rounded shadow-xl p-2.5 flex flex-col gap-1.5">
                  <div className="h-2 bg-slate-800 rounded w-3/4" />
                  <div className="h-1 bg-slate-300 rounded w-1/2" />
                  <div className="h-px bg-slate-200 my-1" />
                  {[80, 90, 70, 85, 65].map((w, i) => (
                    <div key={i} className="h-1 bg-slate-200 rounded" style={{ width: `${w}%` }} />
                  ))}
                  <div className="h-px bg-slate-200 my-1" />
                  {[75, 60].map((w, i) => (
                    <div key={i} className="h-1 bg-slate-100 rounded" style={{ width: `${w}%` }} />
                  ))}
                </div>
                {locked && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                    <Lock className="h-6 w-6 text-white" />
                    <Badge variant="premium" className="text-xs">Pro Only</Badge>
                  </div>
                )}
                {!locked && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button size="sm" variant="default" className="bg-[#efefef] text-[#060606] hover:bg-[#d9d9d9]">
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-1.5">
                  <h3 className="font-semibold text-sm text-[var(--foreground)]">{tpl.name}</h3>
                  {tpl.isPremium && <Badge variant="premium" className="text-[10px]">Pro</Badge>}
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mb-3">{tpl.desc}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {tpl.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-[10px] bg-[#62ba47]/10 text-[#62ba47] rounded-full border border-[#62ba47]/20">{tag}</span>
                  ))}
                </div>
                {locked ? (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => router.push("/dashboard/billing")}>
                    <Lock className="h-3.5 w-3.5" /> Unlock with Pro
                  </Button>
                ) : (
                  <Button size="sm" className="w-full" onClick={() => router.push(`/dashboard/resume/new?template=${tpl.id}`)}>
                    <Check className="h-3.5 w-3.5" /> Use This Template
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

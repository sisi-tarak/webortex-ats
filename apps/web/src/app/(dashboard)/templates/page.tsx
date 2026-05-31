"use client";

import { useState, useEffect } from "react";
import { Lock, Check, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { getTemplates } from "@/lib/firebase/firestore";
import type { Template } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  all: "All Templates",
  tech: "Tech",
  business: "Business",
  academic: "Academic",
};

const TEMPLATE_GRADIENTS: Record<string, string> = {
  "classic-tech": "from-blue-500 to-blue-700",
  "modern-minimal": "from-slate-600 to-slate-800",
  "executive-clean": "from-indigo-600 to-purple-700",
  "data-science": "from-emerald-500 to-teal-700",
  "product-manager": "from-rose-500 to-pink-700",
  "academic-research": "from-amber-600 to-orange-700",
};

function TemplateSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-48 bg-[var(--muted)] animate-pulse" />
      <CardContent className="p-4">
        <div className="h-4 bg-[var(--muted)] rounded w-3/4 mb-2 animate-pulse" />
        <div className="h-3 bg-[var(--muted)] rounded w-full mb-3 animate-pulse" />
        <div className="flex gap-1 mb-3">
          <div className="h-5 bg-[var(--muted)] rounded-full w-16 animate-pulse" />
          <div className="h-5 bg-[var(--muted)] rounded-full w-20 animate-pulse" />
        </div>
        <div className="h-8 bg-[var(--muted)] rounded-lg animate-pulse" />
      </CardContent>
    </Card>
  );
}

export default function TemplatesPage() {
  const { isPro } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getTemplates()
      .then((data) => {
        if (!cancelled) setTemplates(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load templates. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const categories = ["all", ...Array.from(new Set(templates.map((t) => t.category)))];
  const filtered =
    filter === "all" ? templates : templates.filter((t) => t.category === filter);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Resume Templates</h1>
        <p className="text-[var(--muted-foreground)]">
          All templates are LaTeX-compiled and fully ATS-safe. Choose your style.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
              filter === cat
                ? "bg-[var(--primary)] text-[#060606]"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)]"
            }`}
          >
            {CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {!isPro && !loading && templates.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#62ba47]/10 to-[#009dda]/10 border border-[#62ba47]/25 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-[var(--foreground)] text-sm">
              Unlock all {templates.filter((t) => t.isPremium).length}+ premium templates
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Pro plan includes unlimited templates + AI features
            </p>
          </div>
          <Button variant="premium" size="sm" onClick={() => router.push("/dashboard/billing")}>
            Upgrade to Pro
          </Button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <TemplateSkeleton key={i} />)
          : filtered.map((tpl) => {
              const locked = tpl.isPremium && !isPro;
              const gradient =
                TEMPLATE_GRADIENTS[tpl.id] ?? "from-slate-600 to-slate-800";

              return (
                <Card key={tpl.id} hover className="overflow-hidden group">
                  <div
                    className={`h-48 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}
                  >
                    {tpl.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tpl.previewUrl}
                        alt={tpl.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-32 bg-white rounded shadow-xl p-2.5 flex flex-col gap-1.5">
                        <div className="h-2 bg-slate-800 rounded w-3/4" />
                        <div className="h-1 bg-slate-300 rounded w-1/2" />
                        <div className="h-px bg-slate-200 my-1" />
                        {[80, 90, 70, 85, 65].map((w, i) => (
                          <div
                            key={i}
                            className="h-1 bg-slate-200 rounded"
                            style={{ width: `${w}%` }}
                          />
                        ))}
                        <div className="h-px bg-slate-200 my-1" />
                        {[75, 60].map((w, i) => (
                          <div
                            key={i}
                            className="h-1 bg-slate-100 rounded"
                            style={{ width: `${w}%` }}
                          />
                        ))}
                      </div>
                    )}

                    {locked && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                        <Lock className="h-6 w-6 text-white" />
                        <Badge variant="premium" className="text-xs">Pro Only</Badge>
                      </div>
                    )}
                    {!locked && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-[#efefef] text-[#060606] hover:bg-[#d9d9d9]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </Button>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-1.5">
                      <h3 className="font-semibold text-sm text-[var(--foreground)]">
                        {tpl.name}
                      </h3>
                      {tpl.isPremium && (
                        <Badge variant="premium" className="text-[10px]">Pro</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mb-3">
                      {tpl.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tpl.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[10px] bg-[#62ba47]/10 text-[#62ba47] rounded-full border border-[#62ba47]/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {locked ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push("/dashboard/billing")}
                      >
                        <Lock className="h-3.5 w-3.5" /> Unlock with Pro
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          router.push(`/dashboard/resume/new?template=${tpl.id}`)
                        }
                      >
                        <Check className="h-3.5 w-3.5" /> Use This Template
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {!loading && filtered.length === 0 && !error && (
        <div className="text-center py-16">
          <p className="text-[var(--muted-foreground)]">No templates found in this category.</p>
        </div>
      )}
    </div>
  );
}

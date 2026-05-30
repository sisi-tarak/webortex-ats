"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useResumes } from "@/hooks/useResumes";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const TEMPLATES = [
  {
    id: "classic-tech",
    name: "Classic Tech",
    description: "Clean single-column layout. Preferred by FAANG & tech startups.",
    category: "tech",
    isPremium: false,
    previewColor: "from-blue-500 to-blue-700",
    features: ["ATS-safe", "Single column", "Standard fonts"],
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Minimalist design with subtle accent lines. Works for all industries.",
    category: "business",
    isPremium: false,
    previewColor: "from-slate-600 to-slate-800",
    features: ["ATS-safe", "Single column", "Accent lines"],
  },
  {
    id: "executive-clean",
    name: "Executive Clean",
    description: "Professional layout for senior roles. Strong section hierarchy.",
    category: "business",
    isPremium: true,
    previewColor: "from-indigo-600 to-purple-700",
    features: ["ATS-safe", "Single column", "Bold headers"],
  },
  {
    id: "data-science",
    name: "Data Science Pro",
    description: "Optimized for data & ML roles. Dedicated skills matrix section.",
    category: "tech",
    isPremium: true,
    previewColor: "from-emerald-500 to-teal-700",
    features: ["ATS-safe", "Skills matrix", "Tech-focused"],
  },
];

export default function NewResumePage() {
  const router = useRouter();
  const { isPro } = useAuth();
  const { createNew } = useResumes();
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("classic-tech");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please give your resume a title");
      return;
    }
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }
    setCreating(true);
    try {
      const id = await createNew(title.trim(), selectedTemplate);
      toast.success("Resume created! Start filling in your details.");
      router.push(`/dashboard/resume/${id}/edit`);
    } catch {
      toast.error("Failed to create resume. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Create New Resume</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Step {step} of 2 — {step === 1 ? "Name your resume" : "Choose a template"}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} />
        ))}
      </div>

      {step === 1 ? (
        /* STEP 1: Name */
        <div className="max-w-lg">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Name your resume
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Give it a descriptive name so you can track which role you&apos;re applying for.
          </p>

          <Input
            label="Resume Title"
            placeholder="e.g. Google SWE Application, Startup PM Role, FAANG 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && title.trim() && setStep(2)}
            autoFocus
            required
          />

          <div className="flex flex-wrap gap-2 mt-4">
            {["Google SWE Application", "Product Manager — Startup", "Data Scientist — Fintech", "Backend Engineer 2026"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTitle(s)}
                className="px-3 py-1.5 text-xs rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <Button
              size="lg"
              onClick={() => setStep(2)}
              disabled={!title.trim()}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : (
        /* STEP 2: Template */
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Choose a template
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            All templates are LaTeX-compiled and fully ATS-safe. You can change it later.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {TEMPLATES.map((tpl) => {
              const locked = tpl.isPremium && !isPro;
              const selected = selectedTemplate === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => !locked && setSelectedTemplate(tpl.id)}
                  className={`relative text-left rounded-xl border-2 transition-all overflow-hidden ${
                    locked
                      ? "opacity-60 cursor-not-allowed"
                      : selected
                      ? "border-[var(--primary)] shadow-lg shadow-[#62ba47]/15"
                      : "border-[var(--border)] hover:border-[var(--primary)]/50"
                  }`}
                >
                  {/* Template preview */}
                  <div className={`h-32 bg-gradient-to-br ${tpl.previewColor} flex items-center justify-center relative`}>
                    <div className="w-20 h-28 bg-white rounded shadow-lg opacity-90 flex flex-col p-2 gap-1">
                      <div className="h-2 bg-slate-800 rounded w-3/4" />
                      <div className="h-1 bg-slate-300 rounded w-1/2" />
                      <div className="h-px bg-slate-200 rounded mt-1" />
                      {[1, 2, 3].map((l) => (
                        <div key={l} className="h-1 bg-slate-200 rounded" style={{ width: `${60 + l * 10}%` }} />
                      ))}
                      <div className="h-px bg-slate-200 rounded mt-1" />
                      {[1, 2].map((l) => (
                        <div key={l} className="h-1 bg-slate-100 rounded" style={{ width: `${50 + l * 15}%` }} />
                      ))}
                    </div>
                    {locked && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Badge variant="premium" className="text-xs">Pro Only</Badge>
                      </div>
                    )}
                    {selected && !locked && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-[#060606]" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-[var(--foreground)]">{tpl.name}</span>
                      {tpl.isPremium && <Badge variant="premium" className="text-[10px]">Pro</Badge>}
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mb-2">{tpl.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {tpl.features.map((f) => (
                        <span key={f} className="px-2 py-0.5 text-[10px] bg-[#62ba47]/10 text-[#62ba47] rounded-full border border-[#62ba47]/20">{f}</span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
            <Button size="lg" onClick={handleCreate} loading={creating} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Create Resume
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

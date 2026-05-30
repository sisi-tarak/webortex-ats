"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, FileText, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ATSScoreCard } from "@/components/ats/ATSScoreCard";
import { useResumes } from "@/hooks/useResumes";
import { useAuth } from "@/hooks/useAuth";
import { getATSUsage } from "@/lib/firebase/firestore";
import type { ATSReport, ResumeFormData } from "@/lib/types";
import { PLAN_LIMITS, UPGRADE_MESSAGES } from "@/lib/constants";
import { toast } from "sonner";

// ─── Extract plaintext from formData for ATS analysis ────────────────────────
function extractResumeText(formData: ResumeFormData): string {
  const parts: string[] = [];
  const { contact, summary, experience, education, skills, projects, certifications, achievements, languages } = formData;

  // Contact
  parts.push([contact.fullName, contact.email, contact.phone, contact.location].filter(Boolean).join(" | "));
  if (contact.linkedinUrl) parts.push(contact.linkedinUrl);

  // Summary
  if (summary) parts.push(summary);

  // Experience
  experience.forEach((exp) => {
    parts.push(`${exp.jobTitle} at ${exp.company} | ${exp.startDate} – ${exp.endDate}`);
    exp.bullets.filter(Boolean).forEach((b) => parts.push(`• ${b}`));
  });

  // Education
  education.forEach((edu) => {
    parts.push(`${edu.degree} ${edu.field} – ${edu.institution} (${edu.startDate}–${edu.endDate})`);
    if (edu.gpa) parts.push(`GPA: ${edu.gpa}`);
  });

  // Skills
  skills.forEach((s) => {
    parts.push(`${s.category}: ${s.items.join(", ")}`);
  });

  // Projects
  projects.forEach((p) => {
    parts.push(`${p.title} | ${p.technologies.join(", ")}`);
    p.bullets.filter(Boolean).forEach((b) => parts.push(`• ${b}`));
  });

  // Certifications
  certifications.forEach((c) => {
    parts.push(`${c.name} – ${c.issuer} (${c.date})`);
  });

  // Achievements
  achievements.filter(Boolean).forEach((a) => parts.push(`• ${a}`));

  // Languages
  languages.forEach((l) => parts.push(`${l.language}: ${l.proficiency}`));

  return parts.filter(Boolean).join("\n");
}

function ATSCheckerContent() {
  const searchParams = useSearchParams();
  const resumeIdParam = searchParams.get("resumeId");
  const { user, profile, isPro } = useAuth();
  const { resumes } = useResumes();
  const [selectedResumeId, setSelectedResumeId] = useState(resumeIdParam || "");
  const [jobDescription, setJobDescription] = useState("");
  const [scoring, setScoring] = useState(false);
  const [report, setReport] = useState<ATSReport | null>(null);
  const [usageCount, setUsageCount] = useState<number | null>(null);

  const selectedResume = resumes.find((r) => r.id === selectedResumeId);
  void selectedResume; // used for future resume title display

  // Load current month's ATS usage on mount
  const loadUsage = useCallback(async () => {
    if (!user) return;
    const count = await getATSUsage(user.uid);
    setUsageCount(count);
  }, [user]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const plan = profile?.plan ?? "free";
  const monthlyLimit = PLAN_LIMITS[plan].atsChecksPerMonth;
  const checksUsed = usageCount ?? 0;
  const checksRemaining = monthlyLimit === Infinity ? Infinity : Math.max(0, monthlyLimit - checksUsed);
  const atLimitForMonth = checksRemaining === 0;

  const handleScore = async () => {
    if (!selectedResumeId) {
      toast.error("Please select a resume to score");
      return;
    }
    if (!user) return;

    // ─── Plan enforcement ─────────────────────────────────────────────────
    if (atLimitForMonth) {
      toast.error(UPGRADE_MESSAGES.atsLimit);
      return;
    }

    setScoring(true);
    try {
      // Extract plaintext for scoring
      const resumeText = selectedResume
        ? extractResumeText(selectedResume.formData)
        : "No resume content available for analysis.";

      // Get Firebase ID token for API auth
      const idToken = await user.getIdToken();

      const res = await fetch("/api/ats-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          resumeId: selectedResumeId,
          resumeText,
          jobDescription: jobDescription || undefined,
        }),
      });

      if (res.status === 403) {
        const body = (await res.json()) as { code?: string };
        if (body.code === "ATS_LIMIT_REACHED") {
          toast.error(UPGRADE_MESSAGES.atsLimit);
          return;
        }
      }

      if (!res.ok) {
        throw new Error(`Scoring failed: ${res.status}`);
      }

      const data = (await res.json()) as {
        score: number;
        reportId: string;
        breakdown: ATSReport["breakdown"];
        suggestions: ATSReport["suggestions"];
      };

      const fullReport: ATSReport = {
        id: data.reportId,
        resumeId: selectedResumeId,
        userId: user.uid,
        score: data.score,
        breakdown: data.breakdown,
        suggestions: data.suggestions,
        jobDescription,
        createdAt: new Date().toISOString(),
      };

      setReport(fullReport);
      // Server-side route already incremented usage — sync local counter
      setUsageCount((prev) => (prev ?? 0) + 1);
      toast.success("ATS score calculated!");
    } catch {
      toast.error("Failed to calculate ATS score. Please try again.");
    } finally {
      setScoring(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-6 w-6 text-[var(--primary)]" />
          <h1 className="text-2xl font-bold text-[var(--foreground)]">ATS Score Checker</h1>
        </div>
        <p className="text-[var(--muted-foreground)]">
          Check how well your resume will perform against ATS scanners. Paste a job description
          for a tailored keyword analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Resume selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--primary)]" />
                Select Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resumes.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-[var(--muted-foreground)] mb-3">No resumes yet</p>
                  <Button size="sm" variant="outline" asChild>
                    <a href="/dashboard/resume/new">Create a Resume</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {resumes.map((resume) => (
                    <button
                      key={resume.id}
                      type="button"
                      onClick={() => setSelectedResumeId(resume.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all text-sm ${
                        selectedResumeId === resume.id
                          ? "border-[var(--primary)] bg-[#62ba47]/10 text-[var(--primary)]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--foreground)]"
                      }`}
                    >
                      <div className="font-medium truncate">{resume.title}</div>
                      {resume.atsScore && (
                        <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                          Last score: {resume.atsScore}%
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* JD Input */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#62ba47]" />
                  Job Description
                </CardTitle>
                <Badge variant="success" className="text-[10px]">+30 score points</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste the full job description here for keyword matching...&#10;&#10;The more complete the JD, the better the keyword analysis."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[160px] text-xs"
                hint="Optional but strongly recommended — adds keyword match scoring"
              />
            </CardContent>
          </Card>

          {/* Free tier limit warning */}
          {!isPro && (
            <div className={`p-3 rounded-lg border flex items-start gap-2 ${
              atLimitForMonth
                ? "bg-red-500/10 border-red-500/30"
                : "bg-amber-500/10 border-amber-500/30"
            }`}>
              <AlertCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${atLimitForMonth ? "text-red-400" : "text-amber-400"}`} />
              <div>
                {atLimitForMonth ? (
                  <>
                    <p className="text-xs font-medium text-red-400">Monthly limit reached</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Upgrade to Pro for unlimited ATS checks and AI suggestions.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-medium text-amber-400">
                      Free plan: {checksRemaining === Infinity ? "∞" : checksRemaining} check{checksRemaining !== 1 ? "s" : ""} remaining this month
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Upgrade to Pro for unlimited checks and AI-powered suggestions.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleScore}
            loading={scoring}
            disabled={!selectedResumeId || atLimitForMonth}
          >
            <BarChart3 className="h-4 w-4" />
            {scoring ? "Analyzing Resume..." : "Calculate ATS Score"}
          </Button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3">
          {!report && !scoring ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/30">
              <BarChart3 className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                Ready to Score Your Resume
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] text-center max-w-xs">
                Select a resume, optionally paste a job description, and click Calculate ATS Score.
              </p>
            </div>
          ) : scoring ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <div className="w-12 h-12 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin mb-4" />
              <p className="text-sm font-medium text-[var(--foreground)] mb-1">Analyzing your resume...</p>
              <p className="text-xs text-[var(--muted-foreground)]">Checking keywords, formatting, and structure</p>
            </div>
          ) : (
            report && <ATSScoreCard report={report} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ATSCheckerPage() {
  return (
    <Suspense fallback={
      <div className="p-6 lg:p-8 max-w-5xl">
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-[#222222] rounded w-64 mb-2" />
          <div className="h-4 bg-[#222222] rounded w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-[#222222] rounded-xl" />
            <div className="h-48 bg-[#222222] rounded-xl" />
            <div className="h-12 bg-[#222222] rounded-xl" />
          </div>
          <div className="lg:col-span-3">
            <div className="h-96 bg-[#222222] rounded-xl" />
          </div>
        </div>
      </div>
    }>
      <ATSCheckerContent />
    </Suspense>
  );
}

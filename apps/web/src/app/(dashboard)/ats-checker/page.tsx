"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, FileText, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ATSScoreCard } from "@/components/ats/ATSScoreCard";
import { useResumes } from "@/hooks/useResumes";
import { useAuth } from "@/hooks/useAuth";
import { saveATSReport } from "@/lib/firebase/firestore";
import type { ATSReport } from "@/lib/types";
import { toast } from "sonner";

// Mock ATS report generator (real scoring comes from Python backend in Phase 2)
function generateMockReport(resumeId: string, userId: string, jd: string): ATSReport {
  const hasJD = jd.trim().length > 50;
  const score = Math.floor(Math.random() * 30) + (hasJD ? 55 : 45);

  return {
    id: Math.random().toString(36).slice(2),
    resumeId,
    userId,
    score,
    breakdown: {
      keywords: {
        score: hasJD ? Math.floor(score * 0.3) : 12,
        matched: hasJD ? ["Python", "React", "leadership", "agile", "REST API"] : ["communication", "teamwork"],
        missing: hasJD ? ["Kubernetes", "CI/CD", "stakeholder management"] : ["Python", "React", "agile"],
        density: 3.2,
      },
      format: {
        score: 18,
        issues: [],
        isSingleColumn: true,
        hasNoTables: true,
        hasNoImages: true,
      },
      sections: {
        score: 12,
        present: ["Contact", "Summary", "Experience", "Education", "Skills"],
        missing: ["Certifications"],
      },
      quantitative: {
        score: Math.floor(score * 0.2),
        percentage: Math.floor(Math.random() * 40) + 20,
        weakBullets: [
          "Managed a team",
          "Worked on backend systems",
          "Helped with product development",
        ],
      },
      dateFormatting: {
        score: 9,
        issues: [],
      },
      contactInfo: {
        score: 4,
        hasEmail: true,
        hasPhone: true,
        hasLinkedIn: false,
      },
    },
    suggestions: [
      { category: "quantitative", priority: "critical", message: "3 bullet points lack quantitative metrics", action: "Add numbers: team size, percentage improvement, time saved, revenue generated" },
      { category: "contactInfo", priority: "high", message: "LinkedIn URL is missing from contact section", action: "Add your LinkedIn profile URL — recruiters and ATS systems look for it" },
      ...(hasJD ? [{ category: "keywords" as const, priority: "high" as const, message: "3 critical keywords from the JD are missing", action: "Add 'Kubernetes', 'CI/CD', and 'stakeholder management' to relevant sections" }] : []),
      { category: "sections", priority: "medium", message: "No Certifications section found", action: "Add certifications section if you have relevant credentials" },
    ],
    jobDescription: jd,
    createdAt: new Date().toISOString(),
  };
}

function ATSCheckerContent() {
  const searchParams = useSearchParams();
  const resumeIdParam = searchParams.get("resumeId");
  const { user, isPro } = useAuth();
  const { resumes } = useResumes();
  const [selectedResumeId, setSelectedResumeId] = useState(resumeIdParam || "");
  const [jobDescription, setJobDescription] = useState("");
  const [scoring, setScoring] = useState(false);
  const [report, setReport] = useState<ATSReport | null>(null);

  const selectedResume = resumes.find((r) => r.id === selectedResumeId);
  void selectedResume; // used for future resume title display

  const handleScore = async () => {
    if (!selectedResumeId) {
      toast.error("Please select a resume to score");
      return;
    }
    if (!user) return;

    setScoring(true);
    try {
      // In Phase 2: call the real ATS API
      // For now: generate a mock report
      await new Promise((res) => setTimeout(res, 2000)); // simulate API call
      const mockReport = generateMockReport(selectedResumeId, user.uid, jobDescription);
      setReport(mockReport);
      // Save to Firestore
      await saveATSReport({
        resumeId: mockReport.resumeId,
        userId: mockReport.userId,
        score: mockReport.score,
        breakdown: mockReport.breakdown,
        suggestions: mockReport.suggestions,
        jobDescription: mockReport.jobDescription,
      });
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
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-400">Free plan: 2 ATS checks/month</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Upgrade to Pro for unlimited checks and AI-powered suggestions.
                </p>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleScore}
            loading={scoring}
            disabled={!selectedResumeId}
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

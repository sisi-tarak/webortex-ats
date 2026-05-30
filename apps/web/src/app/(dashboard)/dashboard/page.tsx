"use client";

import Link from "next/link";
import {
  Plus,
  FileText,
  BarChart3,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Crown,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { useAuth } from "@/hooks/useAuth";
import { useResumes } from "@/hooks/useResumes";
import { formatDate, getScoreColor, getScoreLabel } from "@/lib/utils";

export default function DashboardPage() {
  const { profile, isPro } = useAuth();
  const { resumes, loading } = useResumes();

  const recentResumes = resumes.slice(0, 3);
  const avgScore =
    resumes.filter((r) => r.atsScore).length > 0
      ? Math.round(
          resumes.filter((r) => r.atsScore).reduce((sum, r) => sum + (r.atsScore || 0), 0) /
            resumes.filter((r) => r.atsScore).length
        )
      : null;

  const firstName = profile?.displayName?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          {resumes.length === 0
            ? "Let's build your first ATS-optimized resume."
            : `You have ${resumes.length} resume${resumes.length !== 1 ? "s" : ""}. Keep optimizing!`}
        </p>
      </div>

      {/* Upgrade Banner for free users */}
      {!isPro && (
        <div className="mb-6 rounded-xl bg-gradient-to-r from-[#62ba47] to-[#009dda] p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-[#060606]" />
            <div>
              <p className="font-semibold text-[#060606]">Unlock Pro Features</p>
              <p className="text-sm text-[#060606]/80">
                AI bullet optimizer, unlimited resumes, clean PDFs & more
              </p>
            </div>
          </div>
          <Button variant="default" size="sm" className="bg-[#060606] text-[#efefef] hover:bg-[#222222] flex-shrink-0" asChild>
            <Link href="/dashboard/billing">
              Upgrade — ₹299/mo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#62ba47]/10">
                <FileText className="h-5 w-5 text-[#62ba47]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--foreground)]">{resumes.length}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Total Resumes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#62ba47]/10">
                <BarChart3 className="h-5 w-5 text-[#62ba47]" />
              </div>
              <div>
                <p className={`text-2xl font-bold font-mono ${avgScore ? getScoreColor(avgScore) : "text-[var(--muted-foreground)]"}`}>
                  {avgScore ? `${avgScore}%` : "—"}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Avg ATS Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#009dda]/10">
                <Target className="h-5 w-5 text-[#009dda]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {resumes.filter((r) => (r.atsScore || 0) >= 80).length}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Ready to Apply</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#62ba47]/10">
                <TrendingUp className="h-5 w-5 text-[#62ba47]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {isPro ? "Pro" : "Free"}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Current Plan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Resumes */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Recent Resumes</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/resumes">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl skeleton" />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <Card className="border-dashed border-2 hover:border-[var(--primary)] transition-colors">
              <CardContent className="p-10 text-center">
                <FileText className="h-10 w-10 text-[var(--muted-foreground)] mx-auto mb-4" />
                <h3 className="font-semibold text-[var(--foreground)] mb-2">
                  No resumes yet
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-6">
                  Build your first ATS-optimized resume — it takes about 15 minutes
                </p>
                <Button asChild>
                  <Link href="/dashboard/resume/new">
                    <Plus className="h-4 w-4" />
                    Create My First Resume
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentResumes.map((resume) => (
                <Link key={resume.id} href={`/dashboard/resume/${resume.id}/edit`}>
                  <Card hover className="transition-all">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-2.5 rounded-lg bg-[var(--muted)] flex-shrink-0">
                        <FileText className="h-5 w-5 text-[var(--muted-foreground)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-[var(--foreground)] truncate">
                            {resume.title}
                          </p>
                          <Badge variant={resume.status === "compiled" ? "success" : "muted"} className="text-[10px] flex-shrink-0">
                            {resume.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(resume.updatedAt)}
                          </span>
                          {resume.atsScore && (
                            <span className={`font-mono font-semibold ${getScoreColor(resume.atsScore)}`}>
                              ATS: {resume.atsScore}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {resume.atsScore ? (
                          <div className="w-16">
                            <Progress
                              value={resume.atsScore}
                              size="sm"
                              color={resume.atsScore >= 80 ? "#62ba47" : resume.atsScore >= 60 ? "#f59e0b" : "#ef4444"}
                            />
                          </div>
                        ) : (
                          <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/resume/new">
                  <Plus className="h-4 w-4" />
                  New Resume
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Quick Actions & Tips */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Quick Actions</h2>

          <div className="space-y-3">
            <Card hover>
              <Link href="/dashboard/resume/new">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#62ba47]/10">
                    <Plus className="h-5 w-5 text-[#62ba47]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)] text-sm">New Resume</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Start from a template</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] ml-auto" />
                </CardContent>
              </Link>
            </Card>

            <Card hover>
              <Link href="/dashboard/ats-checker">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#62ba47]/10">
                    <BarChart3 className="h-5 w-5 text-[#62ba47]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)] text-sm">ATS Checker</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Score your resume</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] ml-auto" />
                </CardContent>
              </Link>
            </Card>

            <Card hover>
              <Link href="/dashboard/templates">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#009dda]/10">
                    <Sparkles className="h-5 w-5 text-[#009dda]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)] text-sm">Browse Templates</p>
                    <p className="text-xs text-[var(--muted-foreground)]">10+ ATS-safe designs</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] ml-auto" />
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* ATS Tip */}
          <Card className="bg-[#009dda]/10 border-[#009dda]/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-2 mb-2">
                <Target className="h-4 w-4 text-[#009dda] mt-0.5 flex-shrink-0" />
                <p className="text-xs font-semibold text-[#efefef]">ATS Pro Tip</p>
              </div>
              <p className="text-xs text-[#c5c5c5] leading-relaxed">
                Resumes with quantified bullet points (numbers, percentages, dollar amounts)
                score <strong>40% higher</strong> on ATS systems. Add metrics to every experience bullet.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

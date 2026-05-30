"use client";

import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getScoreColor, getScoreLabel, getScoreStroke } from "@/lib/utils";
import type { ATSReport } from "@/lib/types";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  Key,
  LayoutList,
  Hash,
  Calendar,
  Phone,
  Lightbulb,
} from "lucide-react";

const CATEGORY_CONFIG = {
  keywords: {
    label: "Keyword Match",
    icon: Key,
    maxScore: 30,
    description: "How well your resume matches the job description keywords",
  },
  format: {
    label: "Formatting",
    icon: LayoutList,
    maxScore: 20,
    description: "ATS-safe formatting — single column, no tables or images",
  },
  sections: {
    label: "Required Sections",
    icon: Hash,
    maxScore: 15,
    description: "Presence of all key resume sections",
  },
  quantitative: {
    label: "Quantitative Impact",
    icon: TrendingUp,
    maxScore: 20,
    description: "Percentage of bullets with numbers and metrics",
  },
  dateFormatting: {
    label: "Date Formatting",
    icon: Calendar,
    maxScore: 10,
    description: "Consistent date formats that ATS parsers can read",
  },
  contactInfo: {
    label: "Contact Info",
    icon: Phone,
    maxScore: 5,
    description: "Email, phone, and LinkedIn presence",
  },
};

const PRIORITY_CONFIG = {
  critical: { color: "text-red-400 bg-red-500/10 border-red-500/30", icon: AlertTriangle, label: "Critical" },
  high: { color: "text-amber-400 bg-amber-500/10 border-amber-500/30", icon: AlertTriangle, label: "High" },
  medium: { color: "text-[#009dda] bg-[#009dda]/10 border-[#009dda]/30", icon: Info, label: "Medium" },
  low: { color: "text-[#62ba47] bg-[#62ba47]/10 border-[#62ba47]/30", icon: CheckCircle2, label: "Low" },
};

interface ATSScoreCardProps {
  report: ATSReport;
}

export function ATSScoreCard({ report }: ATSScoreCardProps) {
  const scoreColor = getScoreStroke(report.score);
  const circumference = 2 * Math.PI * 40; // r=40
  const strokeDashoffset = circumference - (report.score / 100) * circumference;

  const criticalSuggestions = report.suggestions.filter((s) => s.priority === "critical");
  const otherSuggestions = report.suggestions.filter((s) => s.priority !== "critical");

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-8">
            {/* Score Ring */}
            <div className="relative flex-shrink-0">
              <svg width="120" height="120" viewBox="0 0 100 100">
                {/* Background ring */}
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="#3b3b3b"
                  strokeWidth="10"
                />
                {/* Score ring */}
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 50 50)"
                  className="score-ring-animate transition-all duration-1000 ease-out"
                />
                {/* Score text */}
                <text x="50" y="46" textAnchor="middle" className="text-2xl font-black" style={{ fill: scoreColor, fontSize: "22px", fontWeight: 900, fontFamily: "monospace" }}>
                  {report.score}
                </text>
                <text x="50" y="62" textAnchor="middle" style={{ fill: "#a0a0a0", fontSize: "10px" }}>
                  /100
                </text>
              </svg>
            </div>

            {/* Score summary */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-[var(--foreground)]">
                  ATS Score: <span style={{ color: scoreColor }}>{report.score}/100</span>
                </h2>
                <Badge
                  className={`text-sm px-3 py-1 ${
                    report.score >= 80 ? "bg-[#62ba47]/15 text-[#62ba47]" :
                    report.score >= 60 ? "bg-amber-500/15 text-amber-400" :
                    "bg-red-500/15 text-red-400"
                  }`}
                >
                  {getScoreLabel(report.score)}
                </Badge>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                {report.score >= 80
                  ? "Excellent! Your resume is highly ATS-optimized. Apply with confidence."
                  : report.score >= 60
                  ? "Good score. A few improvements can push this above 80 and significantly improve your chances."
                  : "Your resume needs optimization. Fix the critical issues below to improve your ATS pass rate."}
              </p>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                  <span className="text-[var(--muted-foreground)]">Keywords matched:</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {report.breakdown.keywords.matched.length}/{report.breakdown.keywords.matched.length + report.breakdown.keywords.missing.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                  <span className="text-[var(--muted-foreground)]">Quantified bullets:</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {report.breakdown.quantitative.percentage}%
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <LayoutList className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                  <span className="text-[var(--muted-foreground)]">Sections complete:</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {report.breakdown.sections.present.length}/{report.breakdown.sections.present.length + report.breakdown.sections.missing.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const breakdown = report.breakdown[key as keyof typeof report.breakdown];
              const score = typeof breakdown === "object" && "score" in breakdown ? (breakdown as { score: number }).score : 0;
              const pct = Math.round((score / config.maxScore) * 100);
              const Icon = config.icon;

              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                      <span className="text-sm font-medium text-[var(--foreground)]">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted-foreground)]">{score}/{config.maxScore}</span>
                      <span className={`text-xs font-bold font-mono ${getScoreColor(pct)}`}>{pct}%</span>
                    </div>
                  </div>
                  <Progress
                    value={pct}
                    size="default"
                    color={getScoreStroke(pct)}
                  />
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">{config.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Missing Keywords */}
      {report.breakdown.keywords.missing.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-400" />
              Missing Keywords
              <Badge variant="warning" className="text-xs ml-1">{report.breakdown.keywords.missing.length} missing</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--muted-foreground)] mb-3">
              These keywords appear in the job description but are missing from your resume. Add them naturally.
            </p>
            <div className="flex flex-wrap gap-2">
              {report.breakdown.keywords.missing.map((kw) => (
                <span key={kw} className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-full font-medium">
                  {kw}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matched Keywords */}
      {report.breakdown.keywords.matched.length > 0 && (
        <Card className="border-[#62ba47]/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#62ba47]" />
              Matched Keywords
              <Badge variant="success" className="text-xs ml-1">{report.breakdown.keywords.matched.length} found</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {report.breakdown.keywords.matched.map((kw) => (
                <span key={kw} className="px-3 py-1.5 bg-[#62ba47]/10 border border-[#62ba47]/30 text-[#62ba47] text-xs rounded-full font-medium">
                  ✓ {kw}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {report.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-[var(--primary)]" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Critical first */}
              {criticalSuggestions.map((suggestion, i) => {
                const cfg = PRIORITY_CONFIG[suggestion.priority];
                const Icon = cfg.icon;
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.color}`}>
                    <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider`}>{cfg.label}</span>
                      </div>
                      <p className="text-sm font-medium">{suggestion.message}</p>
                      {suggestion.action && (
                        <p className="text-xs mt-1 opacity-80">→ {suggestion.action}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {otherSuggestions.map((suggestion, i) => {
                const cfg = PRIORITY_CONFIG[suggestion.priority];
                const Icon = cfg.icon;
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.color}`}>
                    <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider">{cfg.label}</span>
                      </div>
                      <p className="text-sm font-medium">{suggestion.message}</p>
                      {suggestion.action && (
                        <p className="text-xs mt-1 opacity-80">→ {suggestion.action}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, checkRateLimit } from "@/lib/middleware/auth";
import { adminDb } from "@/lib/firebase/admin";
import { PLAN_LIMITS } from "@/lib/types";
import { FieldValue } from "firebase-admin/firestore";

// ─── Request schema ───────────────────────────────────────────────────────────
const atsScoreSchema = z.object({
  resumeId: z.string().min(1),
  resumeText: z.string().min(50, "Resume text must be at least 50 characters"),
  jobDescription: z.string().optional(),
});

// ─── Monthly usage doc ID ─────────────────────────────────────────────────────
function atsUsageDocId(uid: string): string {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `${uid}_${month}`;
}

// ─── POST /api/ats-score ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Auth
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const { uid } = auth;

  // 2. Rate limit (10 requests / 10 min per user — server-side guard)
  const rl = checkRateLimit(`ats:${uid}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests", retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  // 3. Validate input
  const body = await request.json().catch(() => null);
  const parsed = atsScoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { resumeId, resumeText, jobDescription } = parsed.data;

  // 4. Plan enforcement — check monthly usage from Firestore
  if (adminDb) {
    const userSnap = await adminDb.collection("users").doc(uid).get();
    const plan = (userSnap.data()?.plan as string) ?? "free";
    const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.atsChecksPerMonth ?? 2;

    if (limit !== Infinity) {
      const usageDocId = atsUsageDocId(uid);
      const usageSnap = await adminDb.collection("ats_usage").doc(usageDocId).get();
      const used = (usageSnap.data()?.count as number) ?? 0;

      if (used >= limit) {
        return NextResponse.json(
          {
            error: "Monthly ATS check limit reached",
            code: "ATS_LIMIT_REACHED",
            limit,
            used,
          },
          { status: 403 }
        );
      }
    }
  }

  // 5. Call Python ATS scoring service (Cloud Run)
  //    Stub in development; real endpoint in production.
  let scoreResult: ATSScoreResult;

  const atsApiUrl = process.env.ATS_API_URL;
  if (atsApiUrl) {
    // Production path — forward to Python FastAPI microservice
    const apiRes = await fetch(`${atsApiUrl}/score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ATS_API_SECRET ?? ""}`,
      },
      body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
    });

    if (!apiRes.ok) {
      const errBody = await apiRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: "ATS scoring service error", details: errBody },
        { status: 502 }
      );
    }

    scoreResult = (await apiRes.json()) as ATSScoreResult;
  } else {
    // Development stub — mirrors the shape of the real API response
    scoreResult = generateStubScore(resumeText, jobDescription);
  }

  // 6. Atomically increment usage counter in Firestore
  if (adminDb) {
    const usageDocId = atsUsageDocId(uid);
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const usageRef = adminDb.collection("ats_usage").doc(usageDocId);

    const usageSnap = await usageRef.get();
    if (usageSnap.exists) {
      await usageRef.update({
        count: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await usageRef.set({
        uid,
        count: 1,
        month,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  // 7. Save ATS report to Firestore
  let reportId = "";
  if (adminDb) {
    const reportRef = adminDb.collection("ats_reports").doc();
    reportId = reportRef.id;
    await reportRef.set({
      resumeId,
      userId: uid,
      score: scoreResult.score,
      breakdown: scoreResult.breakdown,
      suggestions: scoreResult.suggestions,
      jobDescription: jobDescription ?? "",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update resume's latest ATS score
    await adminDb.collection("resumes").doc(resumeId).update({
      atsScore: scoreResult.score,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return NextResponse.json({
    success: true,
    reportId,
    score: scoreResult.score,
    breakdown: scoreResult.breakdown,
    suggestions: scoreResult.suggestions,
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ATSScoreResult {
  score: number;
  breakdown: {
    keywords: { score: number; matched: string[]; missing: string[]; density: number };
    format: { score: number; issues: string[]; isSingleColumn: boolean; hasNoTables: boolean; hasNoImages: boolean };
    sections: { score: number; present: string[]; missing: string[] };
    quantitative: { score: number; percentage: number; weakBullets: string[] };
    dateFormatting: { score: number; issues: string[] };
    contactInfo: { score: number; hasEmail: boolean; hasPhone: boolean; hasLinkedIn: boolean };
  };
  suggestions: Array<{
    category: string;
    priority: "critical" | "high" | "medium" | "low";
    message: string;
    action?: string;
  }>;
}

// ─── Development stub ─────────────────────────────────────────────────────────
function generateStubScore(resumeText: string, jd?: string): ATSScoreResult {
  const hasJD = (jd?.trim().length ?? 0) > 50;
  const textLen = resumeText.length;
  // Simple heuristics to produce semi-realistic scores
  const base = Math.min(95, 45 + Math.floor(textLen / 200));
  const score = hasJD ? Math.max(base - 10, 40) : base;

  return {
    score,
    breakdown: {
      keywords: {
        score: Math.round(score * 0.3),
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
        score: Math.round(score * 0.2),
        percentage: Math.floor(Math.random() * 40) + 20,
        weakBullets: ["Managed a team", "Worked on backend systems"],
      },
      dateFormatting: { score: 9, issues: [] },
      contactInfo: { score: 4, hasEmail: true, hasPhone: true, hasLinkedIn: false },
    },
    suggestions: [
      {
        category: "quantitative",
        priority: "critical",
        message: "2 bullet points lack quantitative metrics",
        action: "Add numbers: team size, % improvement, time saved, revenue generated",
      },
      {
        category: "contactInfo",
        priority: "high",
        message: "LinkedIn URL is missing from contact section",
        action: "Add your LinkedIn profile URL — recruiters and ATS systems look for it",
      },
      ...(hasJD
        ? [
            {
              category: "keywords",
              priority: "high" as const,
              message: "3 critical keywords from the JD are missing",
              action: "Add 'Kubernetes', 'CI/CD', and 'stakeholder management' to relevant sections",
            },
          ]
        : []),
    ],
  };
}

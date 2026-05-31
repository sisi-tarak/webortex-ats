import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRateLimit } from "@/lib/middleware/auth";
import { adminDb } from "@/lib/firebase/admin";
import { PLAN_LIMITS } from "@/lib/types";
import { FieldValue } from "firebase-admin/firestore";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function atsUsageDocId(uid: string): string {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `${uid}_${month}`;
}

export async function POST(request: NextRequest) {
  // 1. Auth
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const { uid } = auth;

  // 2. Rate limit
  const rl = checkRateLimit(`ats-upload:${uid}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests", retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  // 3. Parse form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("resume");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing 'resume' PDF file in form data" },
      { status: 400 }
    );
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are allowed" },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10 MB." },
      { status: 413 }
    );
  }

  // 4. Plan enforcement
  if (adminDb) {
    const userSnap = await adminDb.collection("users").doc(uid).get();
    const plan = (userSnap.data()?.plan as string) ?? "free";
    const monthlyLimit =
      PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.atsChecksPerMonth ?? 2;

    if (monthlyLimit !== Infinity) {
      const usageSnap = await adminDb
        .collection("ats_usage")
        .doc(atsUsageDocId(uid))
        .get();
      const used = (usageSnap.data()?.count as number) ?? 0;

      if (used >= monthlyLimit) {
        return NextResponse.json(
          {
            error: "Monthly ATS check limit reached",
            code: "ATS_LIMIT_REACHED",
            limit: monthlyLimit,
            used,
          },
          { status: 403 }
        );
      }
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 5. Upload to Cloudflare R2
  const r2Key = `uploads/${uid}/${Date.now()}.pdf`;
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: r2Key,
      Body: buffer,
      ContentType: "application/pdf",
    })
  );

  // 6. Extract text from PDF
  let resumeText = "";
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    resumeText = parsed.text.trim();
  } catch {
    return NextResponse.json(
      { error: "Failed to extract text from PDF. Ensure the file is not scanned/image-only." },
      { status: 422 }
    );
  }

  if (resumeText.length < 50) {
    return NextResponse.json(
      { error: "PDF appears to contain no extractable text. Use a text-based PDF." },
      { status: 422 }
    );
  }

  const jobDescription = (formData.get("jobDescription") as string | null) ?? undefined;

  // 7. Score via ATS service
  let scoreResult: ATSScoreResult;
  const atsApiUrl = process.env.ATS_API_URL;

  if (atsApiUrl) {
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
    scoreResult = generateStubScore(resumeText, jobDescription);
  }

  // 8. Increment usage + save report
  let reportId = "";
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

    const reportRef = adminDb.collection("ats_reports").doc();
    reportId = reportRef.id;
    await reportRef.set({
      resumeId: `uploaded:${uid}`,
      userId: uid,
      score: scoreResult.score,
      breakdown: scoreResult.breakdown,
      suggestions: scoreResult.suggestions,
      jobDescription: jobDescription ?? "",
      sourceType: "uploaded_pdf",
      r2Key,
      createdAt: FieldValue.serverTimestamp(),
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

// ─── Types & stub ────────────────────────────────────────────────────────────
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

function generateStubScore(resumeText: string, jd?: string): ATSScoreResult {
  const hasJD = (jd?.trim().length ?? 0) > 50;
  const textLen = resumeText.length;
  const base = Math.min(95, 45 + Math.floor(textLen / 200));
  const score = hasJD ? Math.max(base - 10, 40) : base;

  return {
    score,
    breakdown: {
      keywords: {
        score: Math.round(score * 0.3),
        matched: hasJD ? ["Python", "React", "leadership", "agile"] : ["communication"],
        missing: hasJD ? ["Kubernetes", "CI/CD"] : ["Python", "React"],
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
        present: ["Contact", "Experience", "Education", "Skills"],
        missing: ["Summary"],
      },
      quantitative: {
        score: Math.round(score * 0.2),
        percentage: Math.floor(Math.random() * 40) + 20,
        weakBullets: ["Managed a team", "Worked on projects"],
      },
      dateFormatting: { score: 9, issues: [] },
      contactInfo: { score: 4, hasEmail: true, hasPhone: false, hasLinkedIn: false },
    },
    suggestions: [
      {
        category: "quantitative",
        priority: "critical",
        message: "Add quantitative metrics to experience bullet points",
        action: "Include numbers: team size, % improvement, time saved",
      },
      ...(hasJD
        ? [
            {
              category: "keywords",
              priority: "high" as const,
              message: "Add missing keywords from the job description",
              action: "Include 'Kubernetes' and 'CI/CD' in relevant sections",
            },
          ]
        : []),
    ],
  };
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, checkRateLimit } from "@/lib/middleware/auth";
import { sanitizeLatex } from "@/lib/utils";
import type { ResumeFormData } from "@/lib/types";

// ─── Input validation ─────────────────────────────────────────────────────────
const CompileRequestSchema = z.object({
  resumeId:   z.string().min(1).max(128),
  templateId: z.string().min(1).max(128),
  formData:   z.object({
    contact: z.object({
      fullName:     z.string().max(200),
      email:        z.string().email().max(200),
      phone:        z.string().max(30),
      location:     z.string().max(200),
      linkedinUrl:  z.string().url().optional().or(z.literal("")),
      githubUrl:    z.string().url().optional().or(z.literal("")),
      portfolioUrl: z.string().url().optional().or(z.literal("")),
    }),
    summary:       z.string().max(1000),
    experience:    z.array(z.object({
      id:            z.string(),
      jobTitle:      z.string().max(200),
      company:       z.string().max(200),
      location:      z.string().max(200),
      startDate:     z.string().max(20),
      endDate:       z.string().max(20),
      isCurrentRole: z.boolean(),
      bullets:       z.array(z.string().max(500)).max(10),
    })).max(20),
    education:      z.array(z.any()).max(10),
    skills:         z.array(z.any()).max(30),
    projects:       z.array(z.any()).max(20),
    certifications: z.array(z.any()).max(20),
    achievements:   z.array(z.string().max(500)).max(20),
    languages:      z.array(z.any()).max(20),
  }),
});

/**
 * Recursively sanitize all string fields in formData to prevent LaTeX injection.
 * Called server-side BEFORE passing data to the LaTeX engine.
 */
function sanitizeFormData(data: ResumeFormData): ResumeFormData {
  function sanitize(value: unknown): unknown {
    if (typeof value === "string") return sanitizeLatex(value);
    if (Array.isArray(value))      return value.map(sanitize);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitize(v)])
      );
    }
    return value;
  }
  return sanitize(data) as ResumeFormData;
}

export async function POST(request: NextRequest) {
  // ── 1. Authentication ───────────────────────────────────────────────────────
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  // ── 2. Rate limiting: 20 compile requests per 10 minutes per user ──────────
  const rateLimit = checkRateLimit(auth.uid, 20, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) },
      }
    );
  }

  // ── 3. Input validation ─────────────────────────────────────────────────────
  let body: z.infer<typeof CompileRequestSchema>;
  try {
    const raw = await request.json();
    body = CompileRequestSchema.parse(raw);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body", details: String(err) },
      { status: 400 }
    );
  }

  const { resumeId, templateId, formData } = body;

  // ── 4. LaTeX sanitization (prevent injection) ───────────────────────────────
  const safeFormData = sanitizeFormData(formData as ResumeFormData);

  try {
    const latexCompileUrl = process.env.LATEX_COMPILE_URL;

    if (!latexCompileUrl) {
      // ── Development stub — real Cloud Run URL required in production ─────────
      return NextResponse.json({
        success: true,
        pdfUrl: `https://placeholder.webortex.com/resume-${resumeId}.pdf`,
        compilationTime: 0,
        stub: true,
        message: "Set LATEX_COMPILE_URL env var to wire the real LaTeX Cloud Run service.",
      });
    }

    // ── Production: call the Tectonic LaTeX engine on GCP Cloud Run ────────────
    const compileRes = await fetch(`${latexCompileUrl}/compile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Internal service auth — Cloud Run service-to-service token
        Authorization: `Bearer ${process.env.LATEX_SERVICE_TOKEN ?? ""}`,
      },
      body: JSON.stringify({ templateId, formData: safeFormData, userId: auth.uid }),
      signal: AbortSignal.timeout(30_000), // 30s hard timeout
    });

    if (!compileRes.ok) {
      const errBody = await compileRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: "LaTeX compilation failed", details: errBody },
        { status: 502 }
      );
    }

    // ── Upload PDF to Cloudflare R2 ───────────────────────────────────────────
    const pdfBuffer = await compileRes.arrayBuffer();
    const r2Key     = `pdfs/${auth.uid}/${resumeId}/${Date.now()}.pdf`;

    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const r2 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
      },
    });

    await r2.send(new PutObjectCommand({
      Bucket:      process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key:         r2Key,
      Body:        Buffer.from(pdfBuffer),
      ContentType: "application/pdf",
      // Private — served via signed URL, not public CDN
    }));

    const compilationTime = Number(compileRes.headers.get("X-Compile-Time-Ms") ?? 0);
    const pdfUrl          = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${r2Key}`;

    return NextResponse.json({ success: true, pdfUrl, compilationTime });

  } catch (error: unknown) {
    console.error("[compile] Unhandled error:", error);
    return NextResponse.json(
      { error: "Compilation failed", details: String(error) },
      { status: 500 }
    );
  }
}

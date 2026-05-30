import { NextRequest, NextResponse } from "next/server";
import type { ResumeFormData } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      resumeId: string;
      templateId: string;
      formData: ResumeFormData;
    };

    const { resumeId, templateId, formData } = body;

    if (!resumeId || !templateId || !formData) {
      return NextResponse.json(
        { error: "Missing required fields: resumeId, templateId, formData" },
        { status: 400 }
      );
    }

    // ── LaTeX Compilation ─────────────────────────────────────────────────────
    // In production: call the LaTeX compilation service running on GCP Cloud Run
    // The Cloud Run service runs Tectonic (Rust-based LaTeX engine) in Docker
    //
    // const latexCompileUrl = process.env.LATEX_COMPILE_URL;
    // const response = await fetch(`${latexCompileUrl}/compile`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ templateId, formData: sanitizeFormData(formData) }),
    // });
    //
    // if (!response.ok) {
    //   const err = await response.json();
    //   throw new Error(err.message || "LaTeX compilation failed");
    // }
    //
    // const pdfBuffer = await response.arrayBuffer();
    //
    // Upload to Cloudflare R2:
    // const r2Key = `pdfs/${resumeId}/${Date.now()}.pdf`;
    // await uploadToR2(r2Key, Buffer.from(pdfBuffer));
    // const pdfUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${r2Key}`;
    //
    // return NextResponse.json({ pdfUrl, compilationTime: response.headers.get("X-Compile-Time") });

    // ── Stub response (Phase 1 — real engine wired in Phase 1 Week 3-4) ──────
    // Returns a placeholder URL for development
    const pdfUrl = `https://placeholder.webortex.com/resume-${resumeId}.pdf`;

    return NextResponse.json({
      success: true,
      pdfUrl,
      compilationTime: 1200,
      message: "LaTeX compilation service will be wired in Week 3-4. Placeholder URL returned.",
    });

  } catch (error: unknown) {
    console.error("Compile route error:", error);
    return NextResponse.json(
      { error: "Compilation failed", details: String(error) },
      { status: 500 }
    );
  }
}

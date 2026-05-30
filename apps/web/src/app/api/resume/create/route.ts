import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/middleware/auth";
import { adminDb } from "@/lib/firebase/admin";
import { PLAN_LIMITS } from "@/lib/types";
import { FieldValue } from "firebase-admin/firestore";

const createResumeSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  templateId: z.string().min(1, "Template ID is required"),
});

export async function POST(request: NextRequest) {
  // 1. Auth
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const { uid } = auth;

  // 2. Validate
  const body = await request.json().catch(() => null);
  const parsed = createResumeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { title, templateId } = parsed.data;

  if (!adminDb) {
    // Dev fallback — client will create the doc itself
    return NextResponse.json({ success: true, resumeId: null, devMode: true });
  }

  // 3. Enforce plan limit by counting existing resumes
  const userSnap = await adminDb.collection("users").doc(uid).get();
  const plan = (userSnap.data()?.plan as string) ?? "free";
  const maxResumes = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.maxResumes ?? 1;

  if (maxResumes !== Infinity) {
    const existingSnap = await adminDb
      .collection("resumes")
      .where("userId", "==", uid)
      .count()
      .get();
    const existingCount = existingSnap.data().count;

    if (existingCount >= maxResumes) {
      return NextResponse.json(
        {
          error: "Resume limit reached",
          code: "RESUME_LIMIT_REACHED",
          limit: maxResumes,
          current: existingCount,
        },
        { status: 403 }
      );
    }
  }

  // 4. Create resume doc
  const resumeRef = adminDb.collection("resumes").doc();
  const now = FieldValue.serverTimestamp();

  await resumeRef.set({
    userId: uid,
    title,
    templateId,
    version: 1,
    status: "draft",
    formData: {
      contact: { fullName: "", email: "", phone: "", location: "" },
      summary: "",
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      achievements: [],
      languages: [],
    },
    createdAt: now,
    updatedAt: now,
  });

  // 5. Increment resumeCount on the user document (Admin bypasses protected field rule)
  await adminDb.collection("users").doc(uid).update({
    resumeCount: FieldValue.increment(1),
    updatedAt: now,
  });

  return NextResponse.json({ success: true, resumeId: resumeRef.id });
}

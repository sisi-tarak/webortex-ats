import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/middleware/auth";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const deleteSchema = z.object({
  resumeId: z.string().min(1),
});

export async function DELETE(request: NextRequest) {
  // 1. Auth
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  const { uid } = auth;

  // 2. Validate
  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { resumeId } = parsed.data;

  if (!adminDb) {
    return NextResponse.json({ success: true, devMode: true });
  }

  // 3. Verify ownership before deleting
  const resumeSnap = await adminDb.collection("resumes").doc(resumeId).get();
  if (!resumeSnap.exists) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }
  if (resumeSnap.data()?.userId !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 4. Delete resume + decrement user's resumeCount atomically
  const batch = adminDb.batch();
  batch.delete(adminDb.collection("resumes").doc(resumeId));
  batch.update(adminDb.collection("users").doc(uid), {
    resumeCount: FieldValue.increment(-1),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  return NextResponse.json({ success: true });
}

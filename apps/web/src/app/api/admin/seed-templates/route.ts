import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const TEMPLATES = [
  {
    id: "classic-tech",
    name: "Classic Tech",
    description: "Clean, ATS-safe. Preferred by FAANG & startups.",
    category: "tech",
    isPremium: false,
    layout: "single-column",
    tags: ["ATS Safe", "Single Column"],
    previewUrl: "",
    latexFile: "",
    downloadCount: 0,
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Minimalist with subtle accent lines. All industries.",
    category: "business",
    isPremium: false,
    layout: "single-column",
    tags: ["ATS Safe", "Single Column"],
    previewUrl: "",
    latexFile: "",
    downloadCount: 0,
  },
  {
    id: "executive-clean",
    name: "Executive Clean",
    description: "Senior roles. Strong section hierarchy.",
    category: "business",
    isPremium: true,
    layout: "single-column",
    tags: ["ATS Safe", "Premium"],
    previewUrl: "",
    latexFile: "",
    downloadCount: 0,
  },
  {
    id: "data-science",
    name: "Data Science Pro",
    description: "Optimized for data & ML roles.",
    category: "tech",
    isPremium: true,
    layout: "single-column",
    tags: ["ATS Safe", "Skills Matrix"],
    previewUrl: "",
    latexFile: "",
    downloadCount: 0,
  },
  {
    id: "product-manager",
    name: "Product Manager",
    description: "Highlights impact & leadership. PM-optimized.",
    category: "business",
    isPremium: true,
    layout: "single-column",
    tags: ["ATS Safe", "Impact Focus"],
    previewUrl: "",
    latexFile: "",
    downloadCount: 0,
  },
  {
    id: "academic-research",
    name: "Academic Research",
    description: "For research & academia. Publications section.",
    category: "academic",
    isPremium: true,
    layout: "single-column",
    tags: ["ATS Safe", "Publications"],
    previewUrl: "",
    latexFile: "",
    downloadCount: 0,
  },
] as const;

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SEED_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!adminDb) {
    return NextResponse.json(
      { error: "Firebase Admin not initialized" },
      { status: 500 }
    );
  }

  const batch = adminDb.batch();

  for (const tpl of TEMPLATES) {
    const ref = adminDb.collection("templates").doc(tpl.id);
    batch.set(
      ref,
      { ...tpl, createdAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  await batch.commit();

  return NextResponse.json({
    success: true,
    seeded: TEMPLATES.length,
    ids: TEMPLATES.map((t) => t.id),
  });
}

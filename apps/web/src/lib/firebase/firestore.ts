import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./config";
import type { Resume, UserProfile, Template, ATSReport } from "@/lib/types";

// ─── User Profile ────────────────────────────────────────────────────────────
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Resumes ─────────────────────────────────────────────────────────────────
export async function getResume(resumeId: string): Promise<Resume | null> {
  const snap = await getDoc(doc(db, "resumes", resumeId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Resume;
}

export async function getUserResumes(uid: string): Promise<Resume[]> {
  const q = query(
    collection(db, "resumes"),
    where("userId", "==", uid),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Resume);
}

export async function createResume(
  uid: string,
  data: Omit<Resume, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = doc(collection(db, "resumes"));
  await setDoc(ref, {
    ...data,
    userId: uid,
    status: "draft",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateResume(
  resumeId: string,
  data: Partial<Resume>
): Promise<void> {
  await updateDoc(doc(db, "resumes", resumeId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteResume(resumeId: string): Promise<void> {
  await deleteDoc(doc(db, "resumes", resumeId));
}

export async function duplicateResume(
  resumeId: string,
  newTitle: string
): Promise<string> {
  const original = await getResume(resumeId);
  if (!original) throw new Error("Resume not found");

  const ref = doc(collection(db, "resumes"));
  await setDoc(ref, {
    ...original,
    id: undefined,
    title: newTitle,
    version: (original.version || 1) + 1,
    parentId: resumeId,
    status: "draft",
    pdfUrl: undefined,
    atsScore: undefined,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// ─── Templates ───────────────────────────────────────────────────────────────
export async function getTemplates(isPremium?: boolean): Promise<Template[]> {
  const constraints: QueryConstraint[] = [orderBy("downloadCount", "desc")];
  if (isPremium !== undefined) {
    constraints.unshift(where("isPremium", "==", isPremium));
  }
  const q = query(collection(db, "templates"), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Template);
}

export async function getTemplate(templateId: string): Promise<Template | null> {
  const snap = await getDoc(doc(db, "templates", templateId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Template;
}

// ─── ATS Reports ─────────────────────────────────────────────────────────────
export async function getATSReport(reportId: string): Promise<ATSReport | null> {
  const snap = await getDoc(doc(db, "ats_reports", reportId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ATSReport;
}

export async function getResumeATSReports(
  resumeId: string,
  maxResults = 5
): Promise<ATSReport[]> {
  const q = query(
    collection(db, "ats_reports"),
    where("resumeId", "==", resumeId),
    orderBy("createdAt", "desc"),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ATSReport);
}

export async function saveATSReport(
  data: Omit<ATSReport, "id" | "createdAt">
): Promise<string> {
  const ref = doc(collection(db, "ats_reports"));
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
  });

  // Also update the resume's atsScore
  await updateDoc(doc(db, "resumes", data.resumeId), {
    atsScore: data.score,
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

// Timestamp helper
export function toDate(ts: Timestamp | string): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  return new Date(ts);
}

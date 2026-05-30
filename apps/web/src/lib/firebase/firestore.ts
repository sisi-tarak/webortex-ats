import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
  type Unsubscribe,
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

/**
 * Real-time subscription to a user's resumes.
 * Returns an unsubscribe function — call it in useEffect cleanup.
 */
export function subscribeToUserResumes(
  uid: string,
  onChange: (resumes: Resume[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "resumes"),
    where("userId", "==", uid),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      const resumes = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Resume);
      onChange(resumes);
    },
    (error) => onError?.(error)
  );
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

// ─── ATS Usage (monthly counter) ─────────────────────────────────────────────

/** Returns the document ID for this month's ATS usage counter, e.g. "uid_2025-06" */
export function atsUsageDocId(uid: string): string {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `${uid}_${month}`;
}

export interface ATSUsage {
  uid: string;
  count: number;
  month: string; // "YYYY-MM"
  createdAt: string;
  updatedAt: string;
}

/** Get the current month's ATS check count for a user. Returns 0 if no doc exists yet. */
export async function getATSUsage(uid: string): Promise<number> {
  const docId = atsUsageDocId(uid);
  const snap = await getDoc(doc(db, "ats_usage", docId));
  if (!snap.exists()) return 0;
  return (snap.data() as ATSUsage).count ?? 0;
}

/** Atomically increment the ATS usage counter for the current month. */
export async function incrementATSUsage(uid: string): Promise<void> {
  const docId = atsUsageDocId(uid);
  const ref = doc(db, "ats_usage", docId);
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, {
      count: increment(1),
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      uid,
      count: 1,
      month,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// ─── Timestamp helper ────────────────────────────────────────────────────────
export function toDate(ts: Timestamp | string): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  return new Date(ts);
}

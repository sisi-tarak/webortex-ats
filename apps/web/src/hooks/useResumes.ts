"use client";

import { useState, useEffect, useCallback } from "react";
import {
  subscribeToUserResumes,
  createResume,
  updateResume,
  duplicateResume,
} from "@/lib/firebase/firestore";
import type { Resume, ResumeFormData } from "@/lib/types";
import { useAuth } from "./useAuth";
import { PLAN_LIMITS, UPGRADE_MESSAGES } from "@/lib/constants";

export function useResumes() {
  const { user, profile } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Real-time listener (onSnapshot) ─────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserResumes(
      user.uid,
      (data) => {
        setResumes(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError("Failed to load resumes");
        setLoading(false);
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("[useResumes] onSnapshot error", err);
        }
      }
    );

    return unsubscribe; // Firestore unsubscribes on component unmount
  }, [user]);

  // ─── Plan helpers ─────────────────────────────────────────────────────────
  const plan = profile?.plan ?? "free";
  const planLimits = PLAN_LIMITS[plan];

  // ─── Create — calls server route (which enforces plan + increments count) ─
  const createNew = async (title: string, templateId: string): Promise<string> => {
    if (!user) throw new Error("Not authenticated");

    // Optimistic client-side guard before hitting the server
    if (resumes.length >= planLimits.maxResumes) {
      throw new Error(UPGRADE_MESSAGES.resumeLimit);
    }

    const idToken = await user.getIdToken();
    const res = await fetch("/api/resume/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ title, templateId }),
    });

    if (res.status === 403) {
      throw new Error(UPGRADE_MESSAGES.resumeLimit);
    }
    if (!res.ok) {
      throw new Error("Failed to create resume. Please try again.");
    }

    const data = (await res.json()) as { resumeId: string | null; devMode?: boolean };

    // Dev mode: adminDb not available — fall back to direct Firestore write
    if (data.devMode || !data.resumeId) {
      const emptyFormData: ResumeFormData = {
        contact: { fullName: "", email: user.email || "", phone: "", location: "" },
        summary: "",
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        achievements: [],
        languages: [],
      };
      return createResume(user.uid, {
        userId: user.uid,
        title,
        version: 1,
        templateId,
        formData: emptyFormData,
        status: "draft",
      });
    }

    // onSnapshot will automatically update `resumes` state
    return data.resumeId;
  };

  // ─── Delete — calls server route (decrements resumeCount) ────────────────
  const remove = async (resumeId: string) => {
    if (!user) throw new Error("Not authenticated");

    const idToken = await user.getIdToken();
    const res = await fetch("/api/resume/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ resumeId }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "Failed to delete resume");
    }
    // onSnapshot will remove the doc from `resumes` automatically
  };

  // ─── Duplicate ────────────────────────────────────────────────────────────
  const duplicate = async (resumeId: string, newTitle: string): Promise<string> => {
    if (resumes.length >= planLimits.maxResumes) {
      throw new Error(UPGRADE_MESSAGES.resumeLimit);
    }
    const id = await duplicateResume(resumeId, newTitle);
    // onSnapshot picks up the new doc automatically
    return id;
  };

  // ─── Update ───────────────────────────────────────────────────────────────
  const update = async (resumeId: string, data: Partial<Resume>) => {
    await updateResume(resumeId, data);
    // onSnapshot propagates the update; optimistically update local state too
    setResumes((prev) =>
      prev.map((r) => (r.id === resumeId ? { ...r, ...data } : r))
    );
  };

  // ─── Manual refresh (force re-fetch — onSnapshot usually makes this unnecessary) ─
  const refresh = useCallback(() => {
    // With onSnapshot active, there's nothing to manually fetch.
    // This is kept for API compatibility with callers that use refresh().
  }, []);

  return { resumes, loading, error, createNew, remove, duplicate, update, refresh };
}

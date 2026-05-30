"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getUserResumes,
  createResume,
  updateResume,
  deleteResume,
  duplicateResume,
} from "@/lib/firebase/firestore";
import type { Resume, ResumeFormData } from "@/lib/types";
import { useAuth } from "./useAuth";
import { generateId } from "@/lib/utils";

export function useResumes() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getUserResumes(user.uid);
      setResumes(data);
    } catch (err) {
      setError("Failed to load resumes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const createNew = async (title: string, templateId: string): Promise<string> => {
    if (!user) throw new Error("Not authenticated");
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
    const id = await createResume(user.uid, {
      userId: user.uid,
      title,
      version: 1,
      templateId,
      formData: emptyFormData,
      status: "draft",
    });
    await load();
    return id;
  };

  const remove = async (resumeId: string) => {
    await deleteResume(resumeId);
    setResumes((prev) => prev.filter((r) => r.id !== resumeId));
  };

  const duplicate = async (resumeId: string, newTitle: string): Promise<string> => {
    const id = await duplicateResume(resumeId, newTitle);
    await load();
    return id;
  };

  const update = async (resumeId: string, data: Partial<Resume>) => {
    await updateResume(resumeId, data);
    setResumes((prev) =>
      prev.map((r) => (r.id === resumeId ? { ...r, ...data } : r))
    );
  };

  return { resumes, loading, error, createNew, remove, duplicate, update, refresh: load };
}

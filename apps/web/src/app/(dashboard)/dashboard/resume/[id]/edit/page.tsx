"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { getResume, updateResume } from "@/lib/firebase/firestore";
import type { Resume, ResumeFormData } from "@/lib/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function ResumeEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const resumeId = params.id as string;

  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompiling, setIsCompiling] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | undefined>();

  useEffect(() => {
    async function load() {
      try {
        const data = await getResume(resumeId);
        if (!data) {
          toast.error("Resume not found");
          router.push("/dashboard");
          return;
        }
        if (data.userId !== user?.uid) {
          toast.error("Access denied");
          router.push("/dashboard");
          return;
        }
        setResume(data);
        if (data.pdfUrl) setPdfUrl(data.pdfUrl);
      } catch {
        toast.error("Failed to load resume");
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [resumeId, user, router]);

  const handleCompile = useCallback(async (formData: ResumeFormData) => {
    if (!resume) return;
    setIsCompiling(true);
    try {
      // Call compile API
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: resume.id, templateId: resume.templateId, formData }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Compilation failed");
      }

      const { pdfUrl: url } = await res.json();
      setPdfUrl(url);
      await updateResume(resume.id, { status: "compiled", pdfUrl: url, lastCompiledAt: new Date().toISOString() });
    } catch (err: unknown) {
      console.error("Compile error:", err);
      // Don't show error toast on every auto-save compile attempt
      await updateResume(resume.id, { status: "error", compilationError: String(err) });
    } finally {
      setIsCompiling(false);
    }
  }, [resume]);

  const handleScore = () => {
    router.push(`/dashboard/ats-checker?resumeId=${resumeId}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading resume editor...</p>
        </div>
      </div>
    );
  }

  if (!resume) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-[var(--foreground)] truncate">
            {resume.title}
          </span>
          <span className="text-xs text-[var(--muted-foreground)] font-mono">v{resume.version}</span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <ResumeEditor
          resume={resume}
          onCompile={handleCompile}
          onScore={handleScore}
          isCompiling={isCompiling}
          pdfUrl={pdfUrl}
        />
      </div>
    </div>
  );
}

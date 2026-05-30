"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Search, FileText, BarChart3, Clock, Download,
  Trash2, Copy, Edit2, MoreVertical, ArrowUpDown,
  CheckCircle2, AlertCircle, Loader2, Filter,
} from "lucide-react";
import { Button }        from "@/components/ui/Button";
import { Input }         from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge }         from "@/components/ui/Badge";
import { Progress }      from "@/components/ui/Progress";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from "@/components/ui/Modal";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useResumes }    from "@/hooks/useResumes";
import { formatDate, getScoreColor, getScoreStroke } from "@/lib/utils";
import { toast }         from "sonner";
import type { Resume }   from "@/lib/types";

type SortKey = "updatedAt" | "createdAt" | "title" | "atsScore";
type FilterStatus = "all" | "compiled" | "draft" | "error";

const STATUS_CONFIG = {
  compiled: { label: "Ready",    icon: CheckCircle2, color: "text-[#62ba47]",     bg: "bg-[#62ba47]/10" },
  draft:    { label: "Draft",    icon: Edit2,        color: "text-[var(--muted-foreground)]", bg: "bg-[var(--muted)]" },
  compiling:{ label: "Building", icon: Loader2,      color: "text-[#009dda]",     bg: "bg-[#009dda]/10" },
  error:    { label: "Error",    icon: AlertCircle,  color: "text-red-400",       bg: "bg-red-500/10"   },
} as const;

export default function ResumesPage() {
  const router = useRouter();
  const { resumes, loading, remove, duplicate } = useResumes();

  const [search,       setSearch]       = useState("");
  const [sortKey,      setSortKey]      = useState<SortKey>("updatedAt");
  const [sortDir,      setSortDir]      = useState<"asc" | "desc">("desc");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [deleteTarget, setDeleteTarget] = useState<Resume | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [duplicating,  setDuplicating]  = useState<string | null>(null);

  // ── Derived list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...resumes];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || r.templateId.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      list = list.filter((r) => r.status === filterStatus);
    }

    // Sort
    list.sort((a, b) => {
      let av: string | number = a[sortKey] ?? "";
      let bv: string | number = b[sortKey] ?? "";
      if (sortKey === "atsScore") {
        av = a.atsScore ?? -1;
        bv = b.atsScore ?? -1;
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [resumes, search, sortKey, sortDir, filterStatus]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget.id);
      toast.success(`"${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete resume");
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (resume: Resume) => {
    setDuplicating(resume.id);
    try {
      const newId = await duplicate(resume.id, `${resume.title} (Copy)`);
      toast.success("Resume duplicated");
      router.push(`/dashboard/resume/${newId}/edit`);
    } catch {
      toast.error("Failed to duplicate resume");
    } finally {
      setDuplicating(null);
    }
  };

  // ── Skeleton ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 bg-[#222222] rounded w-40 mb-2 animate-pulse" />
            <div className="h-4 bg-[#222222] rounded w-64 animate-pulse" />
          </div>
          <div className="h-9 bg-[#222222] rounded w-36 animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-[#222222] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">My Resumes</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            {resumes.length === 0
              ? "Create your first ATS-optimized resume"
              : `${resumes.length} resume${resumes.length !== 1 ? "s" : ""} · ${resumes.filter((r) => (r.atsScore ?? 0) >= 80).length} ready to apply`}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/resume/new">
            <Plus className="h-4 w-4" />
            New Resume
          </Link>
        </Button>
      </div>

      {/* ── Filters & Search ────────────────────────────────────────────────── */}
      {resumes.length > 0 && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search resumes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftAddon={<Search className="h-4 w-4" />}
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--muted-foreground)]" />
            {(["all", "compiled", "draft", "error"] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                  filterStatus === status
                    ? "bg-[var(--primary)] text-[#060606]"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {status === "all" ? "All" : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label ?? status}
              </button>
            ))}
          </div>

          {/* Sort */}
          <button
            onClick={() => toggleSort("updatedAt")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortKey === "updatedAt" ? "Last edited" : sortKey === "atsScore" ? "ATS Score" : "Title"}
          </button>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {resumes.length === 0 ? (
        <Card className="border-dashed border-2 hover:border-[var(--primary)] transition-colors">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#62ba47]/10 flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-[#62ba47]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              No resumes yet
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-8 max-w-xs mx-auto">
              Build your first ATS-optimized, LaTeX-compiled resume. It takes about 15 minutes.
            </p>
            <Button size="lg" asChild>
              <Link href="/dashboard/resume/new">
                <Plus className="h-4 w-4" />
                Create My First Resume
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        /* No results for current search/filter */
        <div className="text-center py-16">
          <Search className="h-8 w-8 text-[var(--muted-foreground)] mx-auto mb-3" />
          <p className="text-[var(--foreground)] font-medium mb-1">No resumes found</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Try a different search term or filter
          </p>
        </div>
      ) : (
        /* ── Resume list ──────────────────────────────────────────────────── */
        <div className="space-y-3">
          {filtered.map((resume) => {
            const statusCfg = STATUS_CONFIG[resume.status] ?? STATUS_CONFIG.draft;
            const StatusIcon = statusCfg.icon;
            const isDuplicatingThis = duplicating === resume.id;

            return (
              <Card key={resume.id} hover className="group transition-all">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    {/* Icon */}
                    <div className={`p-2.5 rounded-lg flex-shrink-0 ${statusCfg.bg}`}>
                      <FileText className={`h-5 w-5 ${statusCfg.color}`} />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Link
                          href={`/dashboard/resume/${resume.id}/edit`}
                          className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors truncate"
                        >
                          {resume.title}
                        </Link>
                        <Badge
                          className={`text-[10px] flex-shrink-0 flex items-center gap-1 ${statusCfg.bg} ${statusCfg.color}`}
                        >
                          <StatusIcon className={`h-3 w-3 ${resume.status === "compiling" ? "animate-spin" : ""}`} />
                          {statusCfg.label}
                        </Badge>
                        {resume.version > 1 && (
                          <span className="text-[10px] text-[var(--muted-foreground)] bg-[var(--muted)] px-1.5 py-0.5 rounded font-mono">
                            v{resume.version}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(resume.updatedAt)}
                        </span>
                        <span className="capitalize">{resume.templateId.replace(/-/g, " ")}</span>
                        {resume.atsScore != null && (
                          <span className={`font-mono font-semibold ${getScoreColor(resume.atsScore)}`}>
                            ATS {resume.atsScore}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ATS progress bar */}
                    {resume.atsScore != null && (
                      <div className="hidden sm:block w-24 flex-shrink-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-[var(--muted-foreground)]">ATS</span>
                          <span className={`text-[10px] font-mono font-bold ${getScoreColor(resume.atsScore)}`}>
                            {resume.atsScore}%
                          </span>
                        </div>
                        <Progress
                          value={resume.atsScore}
                          size="sm"
                          color={getScoreStroke(resume.atsScore)}
                        />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Quick actions — visible on hover */}
                      <div className="hidden sm:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          asChild
                          title="Check ATS Score"
                        >
                          <Link href={`/dashboard/ats-checker?resumeId=${resume.id}`}>
                            <BarChart3 className="h-4 w-4" />
                          </Link>
                        </Button>

                        {resume.pdfUrl && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            asChild
                            title="Download PDF"
                          >
                            <a href={resume.pdfUrl} download target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>

                      {/* Edit CTA */}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/resume/${resume.id}/edit`}>
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </Button>

                      {/* Overflow menu */}
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button
                            className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="z-50 min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--popover)] p-1 shadow-xl shadow-black/40 animate-in fade-in-0 zoom-in-95"
                            sideOffset={6}
                            align="end"
                          >
                            <DropdownMenu.Item asChild>
                              <Link
                                href={`/dashboard/resume/${resume.id}/edit`}
                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-[var(--muted)] text-[var(--foreground)] outline-none transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                                Edit
                              </Link>
                            </DropdownMenu.Item>

                            <DropdownMenu.Item asChild>
                              <Link
                                href={`/dashboard/ats-checker?resumeId=${resume.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-[var(--muted)] text-[var(--foreground)] outline-none transition-colors"
                              >
                                <BarChart3 className="h-3.5 w-3.5 text-[var(--primary)]" />
                                Check ATS Score
                              </Link>
                            </DropdownMenu.Item>

                            <DropdownMenu.Item
                              onSelect={() => handleDuplicate(resume)}
                              disabled={isDuplicatingThis}
                              className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-[var(--muted)] text-[var(--foreground)] outline-none transition-colors disabled:opacity-50"
                            >
                              {isDuplicatingThis
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Copy className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                              }
                              {isDuplicatingThis ? "Duplicating…" : "Duplicate"}
                            </DropdownMenu.Item>

                            {resume.pdfUrl && (
                              <DropdownMenu.Item asChild>
                                <a
                                  href={resume.pdfUrl}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-[var(--muted)] text-[var(--foreground)] outline-none transition-colors"
                                >
                                  <Download className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                                  Download PDF
                                </a>
                              </DropdownMenu.Item>
                            )}

                            <DropdownMenu.Separator className="h-px bg-[var(--border)] my-1" />

                            <DropdownMenu.Item
                              onSelect={() => setDeleteTarget(resume)}
                              className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-red-500/10 text-red-400 outline-none transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add another CTA */}
          <Button variant="outline" className="w-full mt-2" asChild>
            <Link href="/dashboard/resume/new">
              <Plus className="h-4 w-4" />
              Create Another Resume
            </Link>
          </Button>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────────────────── */}
      <Modal open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle>Delete Resume?</ModalTitle>
          </ModalHeader>
          <div className="px-6 py-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[var(--foreground)]">
                &quot;{deleteTarget?.title}&quot;
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              loading={deleting}
            >
              <Trash2 className="h-4 w-4" />
              Delete Resume
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm, useFieldArray, type FieldValues, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Save,
  Download,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { debounce } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Resume, ResumeFormData } from "@/lib/types";
import { updateResume } from "@/lib/firebase/firestore";
import { toast } from "sonner";

// ─── Section collapse state ───────────────────────────────────────────────────
type SectionKey = "contact" | "summary" | "experience" | "education" | "skills" | "projects" | "certifications";

// ─── Form schema ─────────────────────────────────────────────────────────────
const resumeFormSchema = z.object({
  contact: z.object({
    fullName: z.string().min(1, "Required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(10, "Enter a valid phone number"),
    location: z.string().min(1, "Required"),
    linkedinUrl: z.string().optional(),
    githubUrl: z.string().optional(),
    portfolioUrl: z.string().optional(),
  }),
  summary: z.string().max(500, "Summary should be under 500 characters"),
  experience: z.array(z.object({
    id: z.string(),
    jobTitle: z.string().min(1, "Required"),
    company: z.string().min(1, "Required"),
    location: z.string(),
    startDate: z.string().min(1, "Required"),
    endDate: z.string(),
    isCurrentRole: z.boolean(),
    bullets: z.array(z.string()),
  })),
  education: z.array(z.object({
    id: z.string(),
    degree: z.string().min(1, "Required"),
    field: z.string(),
    institution: z.string().min(1, "Required"),
    location: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    gpa: z.string().optional(),
  })),
  skills: z.array(z.object({
    category: z.string().min(1, "Required"),
    items: z.array(z.string()),
  })),
  projects: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, "Required"),
    description: z.string(),
    technologies: z.array(z.string()),
    bullets: z.array(z.string()),
    url: z.string().optional(),
    githubUrl: z.string().optional(),
  })),
  certifications: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, "Required"),
    issuer: z.string(),
    date: z.string(),
    url: z.string().optional(),
  })),
});

type ResumeFormValues = z.infer<typeof resumeFormSchema>;

interface ResumeEditorProps {
  resume: Resume;
  onCompile: (formData: ResumeFormData) => Promise<void>;
  onScore: () => void;
  isCompiling: boolean;
  pdfUrl?: string;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  title,
  icon,
  children,
  badge,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-[var(--card)] hover:bg-[var(--muted)] transition-colors"
      >
        <span className="text-[var(--primary)]">{icon}</span>
        <span className="font-semibold text-sm text-[var(--foreground)] flex-1 text-left">{title}</span>
        {badge && <Badge variant="muted" className="text-xs">{badge}</Badge>}
        {open ? (
          <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
        )}
      </button>
      {open && <div className="p-5 bg-[var(--background)] border-t border-[var(--border)]">{children}</div>}
    </div>
  );
}

export function ResumeEditor({
  resume,
  onCompile,
  onScore,
  isCompiling,
  pdfUrl,
}: ResumeEditorProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [skillInput, setSkillInput] = useState<string[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeFormSchema),
    defaultValues: resume.formData as ResumeFormValues,
  });

  const {
    fields: expFields,
    append: appendExp,
    remove: removeExp,
  } = useFieldArray({ control, name: "experience" });

  const {
    fields: eduFields,
    append: appendEdu,
    remove: removeEdu,
  } = useFieldArray({ control, name: "education" });

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({ control, name: "skills" });

  const {
    fields: projFields,
    append: appendProj,
    remove: removeProj,
  } = useFieldArray({ control, name: "projects" });

  const {
    fields: certFields,
    append: appendCert,
    remove: removeCert,
  } = useFieldArray({ control, name: "certifications" });

  // Auto-save to Firestore on change (debounced 1.5s)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const autoSave = useCallback(
    debounce(async (formData: ResumeFormValues) => {
      try {
        setSaving(true);
        await updateResume(resume.id, { formData: formData as unknown as ResumeFormData });
        setSaved(true);
        await onCompile(formData as unknown as ResumeFormData);
      } catch {
        toast.error("Failed to save. Check your connection.");
      } finally {
        setSaving(false);
      }
    }, 1500),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resume.id, onCompile]
  );

  // Watch for changes
  useEffect(() => {
    const subscription = watch((value) => {
      setSaved(false);
      autoSave(value as ResumeFormValues);
    });
    return () => subscription.unsubscribe();
  }, [watch, autoSave]);

  return (
    <div className="flex h-full">
      {/* ── FORM PANEL (left) ─────────────────────────────────────────────── */}
      <div className={`flex flex-col ${previewVisible ? "w-1/2" : "flex-1"} border-r border-[var(--border)] overflow-hidden`}>
        {/* Editor toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm font-medium text-[var(--foreground)] truncate">
              {resume.title}
            </span>
            {saving ? (
              <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            ) : saved ? (
              <span className="flex items-center gap-1 text-xs text-[#62ba47]">
                <CheckCircle2 className="h-3 w-3" />
                Saved
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <AlertCircle className="h-3 w-3" />
                Unsaved
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => setPreviewVisible(!previewVisible)}>
            {previewVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={onScore}>
            <BarChart3 className="h-4 w-4" />
            Score
          </Button>
          {pdfUrl && (
            <Button size="sm" asChild>
              <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
                Download
              </a>
            </Button>
          )}
        </div>

        {/* Form sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* CONTACT */}
          <Section
            title="Contact Information"
            icon={<span className="text-base">👤</span>}
            defaultOpen
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Full Name"
                  placeholder="Priya Sharma"
                  error={errors.contact?.fullName?.message}
                  required
                  {...register("contact.fullName")}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="priya@example.com"
                  error={errors.contact?.email?.message}
                  required
                  {...register("contact.email")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Phone"
                  placeholder="+91 98765 43210"
                  error={errors.contact?.phone?.message}
                  required
                  {...register("contact.phone")}
                />
                <Input
                  label="Location"
                  placeholder="Bengaluru, Karnataka"
                  error={errors.contact?.location?.message}
                  required
                  {...register("contact.location")}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="LinkedIn URL"
                  placeholder="linkedin.com/in/priya"
                  {...register("contact.linkedinUrl")}
                />
                <Input
                  label="GitHub URL"
                  placeholder="github.com/priya"
                  {...register("contact.githubUrl")}
                />
                <Input
                  label="Portfolio URL"
                  placeholder="priya.dev"
                  {...register("contact.portfolioUrl")}
                />
              </div>
            </div>
          </Section>

          {/* SUMMARY */}
          <Section
            title="Professional Summary"
            icon={<span className="text-base">📝</span>}
            defaultOpen
          >
            <Textarea
              placeholder="Brief 2–3 sentence summary highlighting your experience, key skills, and what you bring to the role. This appears at the top of your resume."
              className="min-h-[100px]"
              hint="Tip: Include your role title, years of experience, and 2-3 key skills. Keep it under 3 sentences."
              {...register("summary")}
            />
          </Section>

          {/* EXPERIENCE */}
          <Section
            title="Work Experience"
            icon={<span className="text-base">💼</span>}
            badge={`${expFields.length} entries`}
            defaultOpen
          >
            <div className="space-y-4">
              {expFields.map((field, index) => (
                <div key={field.id} className="p-4 border border-[var(--border)] rounded-lg space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => removeExp(index)}
                    className="absolute top-3 right-3 p-1 rounded text-red-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Job Title"
                      placeholder="Software Engineer"
                      required
                      {...register(`experience.${index}.jobTitle`)}
                    />
                    <Input
                      label="Company"
                      placeholder="Google"
                      required
                      {...register(`experience.${index}.company`)}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Location"
                      placeholder="Bengaluru, IN"
                      {...register(`experience.${index}.location`)}
                    />
                    <Input
                      label="Start Date"
                      placeholder="06/2022"
                      hint="MM/YYYY"
                      {...register(`experience.${index}.startDate`)}
                    />
                    <Input
                      label="End Date"
                      placeholder="Present or 12/2024"
                      hint="MM/YYYY or Present"
                      {...register(`experience.${index}.endDate`)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--foreground)] block mb-2">
                      Bullet Points
                      <span className="text-xs text-[var(--muted-foreground)] font-normal ml-2">
                        (Start with action verb. Add numbers for ATS boost)
                      </span>
                    </label>
                    <BulletList
                      register={register as unknown as UseFormRegister<FieldValues>}
                      prefix={`experience.${index}.bullets`}
                      defaultBullets={field.bullets || [""]}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  appendExp({
                    id: Math.random().toString(36).slice(2),
                    jobTitle: "",
                    company: "",
                    location: "",
                    startDate: "",
                    endDate: "Present",
                    isCurrentRole: true,
                    bullets: [""],
                  })
                }
              >
                <Plus className="h-4 w-4" />
                Add Work Experience
              </Button>
            </div>
          </Section>

          {/* EDUCATION */}
          <Section
            title="Education"
            icon={<span className="text-base">🎓</span>}
            badge={`${eduFields.length} entries`}
          >
            <div className="space-y-4">
              {eduFields.map((field, index) => (
                <div key={field.id} className="p-4 border border-[var(--border)] rounded-lg space-y-3 relative">
                  <button type="button" onClick={() => removeEdu(index)} className="absolute top-3 right-3 p-1 rounded text-red-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Degree" placeholder="B.Tech" required {...register(`education.${index}.degree`)} />
                    <Input label="Field of Study" placeholder="Computer Science" {...register(`education.${index}.field`)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Institution" placeholder="IIT Bombay" required {...register(`education.${index}.institution`)} />
                    <Input label="Location" placeholder="Mumbai, IN" {...register(`education.${index}.location`)} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="Start Date" placeholder="07/2018" {...register(`education.${index}.startDate`)} />
                    <Input label="End Date" placeholder="06/2022" {...register(`education.${index}.endDate`)} />
                    <Input label="GPA (optional)" placeholder="8.5/10" {...register(`education.${index}.gpa`)} />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="w-full"
                onClick={() => appendEdu({ id: Math.random().toString(36).slice(2), degree: "", field: "", institution: "", location: "", startDate: "", endDate: "" })}>
                <Plus className="h-4 w-4" /> Add Education
              </Button>
            </div>
          </Section>

          {/* SKILLS */}
          <Section title="Skills" icon={<span className="text-base">⚡</span>} badge={`${skillFields.length} categories`}>
            <div className="space-y-3">
              {skillFields.map((field, index) => (
                <div key={field.id} className="p-3 border border-[var(--border)] rounded-lg space-y-2 relative">
                  <button type="button" onClick={() => removeSkill(index)} className="absolute top-2 right-2 p-1 rounded text-red-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <Input label="Category" placeholder="Programming Languages" required {...register(`skills.${index}.category`)} />
                  <Input
                    label="Skills (comma separated)"
                    placeholder="Python, JavaScript, TypeScript, Go"
                    hint="Separate each skill with a comma"
                    {...register(`skills.${index}.items.0`)}
                  />
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="w-full"
                onClick={() => appendSkill({ category: "", items: [""] })}>
                <Plus className="h-4 w-4" /> Add Skill Category
              </Button>
            </div>
          </Section>

          {/* PROJECTS */}
          <Section title="Projects" icon={<span className="text-base">🚀</span>} badge={`${projFields.length} entries`}>
            <div className="space-y-4">
              {projFields.map((field, index) => (
                <div key={field.id} className="p-4 border border-[var(--border)] rounded-lg space-y-3 relative">
                  <button type="button" onClick={() => removeProj(index)} className="absolute top-3 right-3 p-1 rounded text-red-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Project Title" placeholder="E-Commerce Platform" required {...register(`projects.${index}.title`)} />
                    <Input label="Tech Stack" placeholder="React, Node.js, MongoDB" {...register(`projects.${index}.technologies.0`)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Live URL (optional)" placeholder="https://myproject.com" {...register(`projects.${index}.url`)} />
                    <Input label="GitHub URL (optional)" placeholder="github.com/user/repo" {...register(`projects.${index}.githubUrl`)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--foreground)] block mb-2">Bullet Points</label>
                    <BulletList register={register as unknown as UseFormRegister<FieldValues>} prefix={`projects.${index}.bullets`} defaultBullets={field.bullets || [""]} />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="w-full"
                onClick={() => appendProj({ id: Math.random().toString(36).slice(2), title: "", description: "", technologies: [""], bullets: [""] })}>
                <Plus className="h-4 w-4" /> Add Project
              </Button>
            </div>
          </Section>

          {/* CERTIFICATIONS */}
          <Section title="Certifications" icon={<span className="text-base">🏅</span>} badge={`${certFields.length} entries`}>
            <div className="space-y-3">
              {certFields.map((field, index) => (
                <div key={field.id} className="p-3 border border-[var(--border)] rounded-lg space-y-2 relative">
                  <button type="button" onClick={() => removeCert(index)} className="absolute top-2 right-2 p-1 rounded text-red-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Certification Name" placeholder="AWS Solutions Architect" required {...register(`certifications.${index}.name`)} />
                    <Input label="Issuing Organization" placeholder="Amazon Web Services" {...register(`certifications.${index}.issuer`)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Date" placeholder="06/2023" {...register(`certifications.${index}.date`)} />
                    <Input label="URL (optional)" placeholder="https://credly.com/..." {...register(`certifications.${index}.url`)} />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="w-full"
                onClick={() => appendCert({ id: Math.random().toString(36).slice(2), name: "", issuer: "", date: "" })}>
                <Plus className="h-4 w-4" /> Add Certification
              </Button>
            </div>
          </Section>
        </div>
      </div>

      {/* ── PREVIEW PANEL (right) ─────────────────────────────────────────── */}
      {previewVisible && (
        <div className="w-1/2 flex flex-col bg-[#1a1a1a] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Preview</span>
              {isCompiling && (
                <span className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Compiling LaTeX...
                </span>
              )}
            </div>
            <Badge variant="outline" className="text-xs font-mono">LaTeX PDF</Badge>
          </div>

          <div className="flex-1 overflow-y-auto flex items-center justify-center p-6">
            {isCompiling ? (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)] mx-auto mb-4" />
                <p className="text-sm text-[var(--muted-foreground)]">Compiling your LaTeX resume...</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">This usually takes 1–2 seconds</p>
              </div>
            ) : pdfUrl ? (
              <div className="w-full max-w-2xl bg-white shadow-2xl rounded overflow-hidden">
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full"
                  style={{ height: "calc(100vh - 200px)" }}
                  title="Resume Preview"
                />
              </div>
            ) : (
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📄</span>
                </div>
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                  Preview will appear here
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Start filling in your details on the left. Your LaTeX-compiled
                  resume will appear here in real-time.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bullet List helper ───────────────────────────────────────────────────────
function BulletList({
  register,
  prefix,
  defaultBullets,
}: {
  register: UseFormRegister<FieldValues>;
  prefix: string;
  defaultBullets: string[];
}) {
  const [bullets, setBullets] = useState(defaultBullets.length ? defaultBullets : [""]);

  return (
    <div className="space-y-2">
      {bullets.map((_, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span className="mt-2.5 text-[var(--muted-foreground)] text-xs">•</span>
          <input
            {...register(`${prefix}.${i}`)}
            placeholder="Led a team of 5 engineers to deliver X, resulting in Y% improvement"
            className="flex-1 px-3 py-2 text-sm rounded-md border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          {bullets.length > 1 && (
            <button
              type="button"
              onClick={() => setBullets((b) => b.filter((_, j) => j !== i))}
              className="mt-2 p-1 rounded text-red-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setBullets((b) => [...b, ""])}
        className="text-xs"
      >
        <Plus className="h-3 w-3" /> Add bullet point
      </Button>
    </div>
  );
}

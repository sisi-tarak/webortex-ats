// Re-export all types from shared-types package and add any local-only types

export type PlanTier = "free" | "pro" | "enterprise";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  plan: PlanTier;
  planExpiresAt?: string;
  resumeCount: number;
  orgId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string | "Present";
  bullets: string[];
  isCurrentRole: boolean;
}

export interface Education {
  id: string;
  degree: string;
  field: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  achievements?: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  url?: string;
  githubUrl?: string;
  bullets: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
  credentialId?: string;
}

export interface Skill {
  category: string;
  items: string[];
}

export interface ResumeFormData {
  contact: ContactInfo;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  achievements: string[];
  languages: { language: string; proficiency: string }[];
}

export type ResumeStatus = "draft" | "compiling" | "compiled" | "error";

export interface Resume {
  id: string;
  userId: string;
  title: string;
  version: number;
  parentId?: string;
  templateId: string;
  formData: ResumeFormData;
  pdfUrl?: string;
  status: ResumeStatus;
  compilationError?: string;
  atsScore?: number;
  lastCompiledAt?: string;
  jobDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export type TemplateCategory = "tech" | "business" | "creative" | "academic";

export interface Template {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  latexFile: string;
  category: TemplateCategory;
  layout: "single-column" | "two-column";
  isPremium: boolean;
  price?: number;
  tags: string[];
  downloadCount: number;
  createdAt: string;
}

export interface ATSBreakdown {
  keywords: { score: number; matched: string[]; missing: string[]; density: number };
  format: { score: number; issues: string[]; isSingleColumn: boolean; hasNoTables: boolean; hasNoImages: boolean };
  sections: { score: number; present: string[]; missing: string[] };
  quantitative: { score: number; percentage: number; weakBullets: string[] };
  dateFormatting: { score: number; issues: string[] };
  contactInfo: { score: number; hasEmail: boolean; hasPhone: boolean; hasLinkedIn: boolean };
}

export interface ATSSuggestion {
  category: keyof ATSBreakdown;
  priority: "critical" | "high" | "medium" | "low";
  message: string;
  action?: string;
}

export interface ATSReport {
  id: string;
  resumeId: string;
  userId: string;
  score: number;
  breakdown: ATSBreakdown;
  suggestions: ATSSuggestion[];
  jobDescription?: string;
  createdAt: string;
}

export const PLAN_LIMITS = {
  free: {
    maxResumes: 1,
    maxTemplates: 1,
    atsChecksPerMonth: 2,
    cleanPdf: false,
    aiFeatures: false,
  },
  pro: {
    maxResumes: Infinity,
    maxTemplates: Infinity,
    atsChecksPerMonth: Infinity,
    cleanPdf: true,
    aiFeatures: true,
  },
  enterprise: {
    maxResumes: Infinity,
    maxTemplates: Infinity,
    atsChecksPerMonth: Infinity,
    cleanPdf: true,
    aiFeatures: true,
  },
} as const;

// ─── User & Auth ────────────────────────────────────────────────────────────

export type PlanTier = 'free' | 'pro' | 'enterprise';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  plan: PlanTier;
  planExpiresAt?: string; // ISO timestamp
  resumeCount: number;
  orgId?: string; // for enterprise/university users
  createdAt: string;
  updatedAt: string;
}

// ─── Resume Form Data ────────────────────────────────────────────────────────

export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string; // City, State
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string; // MM/YYYY
  endDate: string | 'Present';
  bullets: string[]; // Each bullet point
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

export interface CustomSection {
  id: string;
  title: string;
  content: string;
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
  customSections: CustomSection[];
}

// ─── Resume Document ─────────────────────────────────────────────────────────

export type ResumeStatus = 'draft' | 'compiled' | 'error';

export interface Resume {
  id: string;
  userId: string;
  title: string; // e.g. "Google SWE Application"
  version: number;
  parentId?: string; // if branched from another resume
  templateId: string;
  formData: ResumeFormData;
  pdfUrl?: string; // Cloudflare R2 URL
  pdfPath?: string; // R2 path
  status: ResumeStatus;
  compilationError?: string;
  atsScore?: number;
  lastCompiledAt?: string;
  jobDescription?: string; // JD pasted for ATS matching
  createdAt: string;
  updatedAt: string;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export type TemplateCategory = 'tech' | 'business' | 'creative' | 'academic';
export type TemplateLayout = 'single-column' | 'two-column';

export interface Template {
  id: string;
  name: string;
  description: string;
  previewUrl: string; // R2 URL for preview PNG
  latexFile: string; // R2 path to .tex template
  category: TemplateCategory;
  layout: TemplateLayout;
  isPremium: boolean;
  price?: number; // in INR, for marketplace templates
  authorId?: string;
  tags: string[];
  downloadCount: number;
  createdAt: string;
}

// ─── ATS Scoring ─────────────────────────────────────────────────────────────

export interface ATSBreakdown {
  keywords: {
    score: number; // 0–30
    matched: string[];
    missing: string[];
    density: number; // percentage
  };
  format: {
    score: number; // 0–20
    issues: string[];
    isSingleColumn: boolean;
    hasNoTables: boolean;
    hasNoImages: boolean;
  };
  sections: {
    score: number; // 0–15
    present: string[];
    missing: string[];
  };
  quantitative: {
    score: number; // 0–20
    percentage: number; // % of bullets with numbers
    weakBullets: string[];
  };
  dateFormatting: {
    score: number; // 0–10
    issues: string[];
  };
  contactInfo: {
    score: number; // 0–5
    hasEmail: boolean;
    hasPhone: boolean;
    hasLinkedIn: boolean;
  };
}

export interface ATSSuggestion {
  category: keyof ATSBreakdown;
  priority: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  action?: string;
}

export interface ATSReport {
  id: string;
  resumeId: string;
  userId: string;
  score: number; // 0–100
  breakdown: ATSBreakdown;
  suggestions: ATSSuggestion[];
  jobDescription?: string;
  createdAt: string;
}

// ─── Payments & Subscriptions ────────────────────────────────────────────────

export type SubscriptionStatus = 'created' | 'authenticated' | 'active' | 'pending' | 'halted' | 'cancelled' | 'completed' | 'expired';

export interface Subscription {
  uid: string;
  razorpaySubscriptionId: string;
  razorpayCustomerId?: string;
  plan: PlanTier;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Plan Features ───────────────────────────────────────────────────────────

export const PLAN_FEATURES = {
  free: {
    maxResumes: 1,
    maxTemplates: 1,
    atsChecksPerMonth: 2,
    cleanPdf: false,
    aiFeatures: false,
    jdAnalysis: false,
    resumeVersioning: false,
    prioritySupport: false,
  },
  pro: {
    maxResumes: Infinity,
    maxTemplates: Infinity,
    atsChecksPerMonth: Infinity,
    cleanPdf: true,
    aiFeatures: true,
    jdAnalysis: true,
    resumeVersioning: true,
    prioritySupport: false,
  },
  enterprise: {
    maxResumes: Infinity,
    maxTemplates: Infinity,
    atsChecksPerMonth: Infinity,
    cleanPdf: true,
    aiFeatures: true,
    jdAnalysis: true,
    resumeVersioning: true,
    prioritySupport: true,
  },
} as const;

export type FeatureKey = keyof typeof PLAN_FEATURES['free'];

// ─── API Response Types ──────────────────────────────────────────────────────

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CompileRequest {
  resumeId: string;
  templateId: string;
  formData: ResumeFormData;
}

export interface CompileResponse {
  pdfUrl: string;
  compilationTime: number; // ms
}

export interface ATSScoreRequest {
  resumeId: string;
  resumeText: string;
  jobDescription?: string;
}

// Re-export canonical plan limits defined alongside the type definitions
export { PLAN_LIMITS } from "@/lib/types";

// ─── Upgrade CTA copy (used in UI error messages) ────────────────────────────
export const UPGRADE_MESSAGES = {
  resumeLimit:
    "You've reached the free plan limit of 1 resume. Upgrade to Pro for unlimited resumes.",
  atsLimit:
    "You've used all 2 ATS checks for this month. Upgrade to Pro for unlimited checks.",
} as const;

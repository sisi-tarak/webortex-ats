# Webortex ATS Resume Platform — Claude Code Project Context

## What This Is
A LaTeX-powered ATS-optimized resume builder SaaS. Users fill a form → LaTeX compiles → ATS-friendly PDF generated. Same platform has an ATS score checker with per-parameter scoring. India-first, Razorpay payments.

## Monorepo Structure
```
apps/web/          → Next.js 14 frontend (Cloudflare Pages)
apps/ats-api/      → Python FastAPI ATS scoring microservice (Cloud Run)
packages/ui/       → Shared React component library
packages/shared-types/ → TypeScript types shared across apps
infra/firebase/    → Firestore rules, indexes, Cloud Functions
infra/cloudflare/  → Worker scripts, R2 config
```

## Tech Stack
- Frontend: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- Auth: Firebase Auth (Google OAuth + Phone OTP)
- Database: Firestore (user data, resumes, scores) + Firebase RTDB (real-time sync)
- Storage: Firebase Storage (JSON/content) + Cloudflare R2 (compiled PDFs, template assets)
- CDN/Edge: Cloudflare Pages (frontend) + Cloudflare Workers (edge logic)
- LaTeX: Tectonic in Docker on GCP Cloud Run
- Backend: Firebase Cloud Functions (triggers/webhooks) + Python Cloud Run (NLP/ATS)
- Payments: Razorpay (UPI, Cards, Netbanking, EMI, Subscriptions)
- AI: Claude API (Anthropic) — bullet rewrites, JD analysis, cover letter
- Dev: Claude Code

## Key Conventions

### File Naming
- Components: PascalCase (`ResumeForm.tsx`)
- Hooks: camelCase with `use` prefix (`useResumeEditor.ts`)
- Utils: camelCase (`sanitizeLatex.ts`)
- API routes: kebab-case (`/api/resume/compile`)

### TypeScript
- Always use strict types — no `any`
- All Firebase document types defined in `packages/shared-types/src/`
- Use `zod` for runtime validation of API inputs

### Tailwind
- Use CSS variables for brand colors (defined in globals.css)
- Mobile-first responsive design
- No inline styles — Tailwind classes only

### Firebase
- All Firestore reads on the client must go through custom hooks in `src/hooks/`
- Never access `db`, `auth`, `storage` directly in components — always via hooks or server actions
- Firebase Admin SDK only in Cloud Functions and API routes (never in browser)

## Firestore Collections
```
users/{uid}              → profile, plan, planExpiresAt
resumes/{resumeId}       → userId, title, formData, pdfUrl, atsScore, templateId
templates/{templateId}   → name, isPremium, latexFile, previewUrl
ats_reports/{reportId}   → resumeId, score, breakdown, suggestions
subscriptions/{uid}      → razorpay_subscription_id, plan, status
```

## Security Rules
- Users can only read/write their own documents
- Templates are readable by any authenticated user
- ATS reports are private to the resume owner

## LaTeX Special Characters — MUST escape
& → \& | % → \% | $ → \$ | # → \# | _ → \_ | { → \{ | } → \} | ~ → \textasciitilde{} | ^ → \textasciicircum{} | \ → \textbackslash{}

## Plan Tiers
- free: 1 template, 1 resume, 2 ATS checks/month, watermarked PDF
- pro: all templates, unlimited resumes, unlimited ATS, clean PDF, AI features (₹299/mo)
- enterprise: white-label, bulk analysis, API access

## DO NOT
- Use `any` TypeScript type
- Access Firestore directly in UI components (use hooks)
- Skip LaTeX input sanitization
- Use AWS S3 (use Cloudflare R2)
- Use Stripe (use Razorpay)
- Store compiled PDFs in Firebase Storage (use R2)
- Commit .env files
- Use `console.log` in production code (use structured logging)

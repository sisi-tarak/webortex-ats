"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { signInWithGoogle, signUpWithEmail } from "@/lib/firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

const signupSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { refreshProfile } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (data: SignupForm) => {
    try {
      await signUpWithEmail(data.email, data.password, data.displayName);
      // Refresh profile so the dashboard loads with correct plan/displayName
      await refreshProfile().catch(() => {});
      toast.success("Account created! Welcome to Webortex ATS Resume 🎉");
      router.push(plan === "pro" ? "/dashboard/billing" : "/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const messages: Record<string, string> = {
        "auth/email-already-in-use": "An account with this email already exists",
        "auth/weak-password": "Password is too weak",
        "auth/invalid-email": "Invalid email address",
      };
      toast.error(messages[code || ""] || "Sign up failed. Please try again.");
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      await refreshProfile().catch(() => {});
      toast.success("Welcome to Webortex ATS Resume! 🎉");
      router.push(plan === "pro" ? "/dashboard/billing" : "/dashboard");
    } catch {
      toast.error("Google sign up failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          Create your free account
        </h1>
        <p className="text-[var(--muted-foreground)] text-sm">
          Build your first ATS-optimized resume in 15 minutes
        </p>
        {plan === "pro" && (
          <div className="mt-3 px-3 py-2 bg-[#62ba47]/10 border border-[#62ba47]/25 rounded-lg">
            <p className="text-xs text-[#62ba47] font-medium">
              ✨ You&apos;ll be redirected to start your Pro trial after signup
            </p>
          </div>
        )}
      </div>

      {/* Google Sign Up */}
      <Button
        variant="outline"
        size="lg"
        className="w-full mb-6"
        onClick={handleGoogleSignIn}
        loading={googleLoading}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-[#060606] px-3 text-[var(--muted-foreground)]">or sign up with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          type="text"
          placeholder="Priya Sharma"
          leftAddon={<User className="h-4 w-4" />}
          error={errors.displayName?.message}
          required
          {...register("displayName")}
        />
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          leftAddon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          required
          {...register("email")}
        />
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Min. 8 characters"
          leftAddon={<Lock className="h-4 w-4" />}
          rightAddon={
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-[var(--foreground)] transition-colors">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          error={errors.password?.message}
          required
          {...register("password")}
        />
        <Input
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          placeholder="Repeat your password"
          leftAddon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
          required
          {...register("confirmPassword")}
        />

        <p className="text-xs text-[var(--muted-foreground)]">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-[var(--primary)] hover:underline">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-[var(--primary)] hover:underline">Privacy Policy</Link>.
        </p>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Create Free Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-[#222222] rounded w-3/4" />
        <div className="h-4 bg-[#222222] rounded w-1/2" />
        <div className="h-12 bg-[#222222] rounded" />
        <div className="h-12 bg-[#222222] rounded" />
        <div className="h-12 bg-[#222222] rounded" />
        <div className="h-12 bg-[#222222] rounded" />
        <div className="h-12 bg-[#222222] rounded" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}

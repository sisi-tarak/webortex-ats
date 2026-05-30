"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { resetPassword } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/Button";
import { Input }  from "@/components/ui/Input";
import { toast }  from "sonner";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: FormValues) => {
    try {
      await resetPassword(email);
      setSentTo(email);
      setSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/user-not-found") {
        // Security: don't reveal whether an email exists
        setSentTo(email);
        setSent(true);
      } else {
        toast.error("Failed to send reset link. Please try again.");
      }
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-[#62ba47]/10 border border-[#62ba47]/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-7 w-7 text-[#62ba47]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Check your email</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">
          If an account exists for <span className="text-[var(--foreground)] font-medium">{sentTo}</span>,
          we&apos;ve sent a password reset link. Check your inbox and spam folder.
        </p>
        <p className="text-xs text-[var(--muted-foreground)] mb-8">
          The link expires in 1 hour.
        </p>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sign In
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Reset your password</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          leftAddon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          autoComplete="email"
          required
          {...register("email")}
        />

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Send Reset Link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
        Remembered it?{" "}
        <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftAddon, rightAddon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--foreground)]">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 text-[var(--muted-foreground)]">{leftAddon}</div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              /* Dark theme input:
                 bg #1a1a1a (--input), border #3b3b3b (--border),
                 text #efefef (--foreground), placeholder #a0a0a0 (--muted-foreground)
                 focus ring brand green (#62ba47 = --ring) */
              "flex h-10 w-full rounded-md border border-[var(--border)]",
              "bg-[var(--input)] px-3 py-2 text-sm text-[var(--foreground)]",
              "placeholder:text-[var(--muted-foreground)] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:border-[var(--ring)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500 focus-visible:ring-red-400",
              leftAddon && "pl-9",
              rightAddon && "pr-9",
              className
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 text-[var(--muted-foreground)]">{rightAddon}</div>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--muted-foreground)]">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };

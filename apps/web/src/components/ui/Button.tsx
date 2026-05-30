"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * Webortex color rules:
 *   Primary (green #62ba47)   → dark text #060606  (--primary-foreground)
 *   Secondary (blue #009dda)  → dark text #060606  (--secondary-foreground)
 *   Dark surfaces             → light text #efefef (--foreground)
 *   Light/white surfaces      → dark text #060606
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        /* Green button — dark text on green */
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--brand-green-hover)] shadow-sm",

        /* Blue button — dark text on blue */
        secondary:
          "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--brand-blue-hover)] shadow-sm",

        /* Outlined — transparent bg, light border, light text (dark theme) */
        outline:
          "border border-[var(--border)] bg-transparent hover:bg-[var(--muted)] text-[var(--foreground)] hover:border-[var(--brand-green)]",

        /* Ghost — no border */
        ghost:
          "hover:bg-[var(--muted)] text-[var(--foreground)]",

        /* Danger */
        destructive:
          "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-red-600 shadow-sm",

        /* Text link style */
        link:
          "text-[var(--brand-green)] underline-offset-4 hover:underline hover:text-[var(--brand-green-light)] p-0 h-auto",

        /* Premium / Pro — Webortex green → blue gradient, dark text */
        premium:
          "bg-gradient-to-r from-[#62ba47] to-[#009dda] text-[#060606] hover:from-[#56a63e] hover:to-[#0085bb] shadow-sm font-semibold",
      },
      size: {
        sm:      "h-8 px-3 text-xs",
        default: "h-10 px-4 py-2",
        lg:      "h-12 px-6 text-base",
        xl:      "h-14 px-8 text-lg",
        icon:    "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const classes = cn(buttonVariants({ variant, size, className }));

    // ── asChild mode ─────────────────────────────────────────────────────────
    // Slot (from @radix-ui/react-slot) requires EXACTLY one React element child.
    // React.Children.count treats null as a child (typeof null === "object"),
    // so we must not emit any conditional null nodes alongside children.
    if (asChild) {
      const SlotEl = Slot as React.ElementType;
      return (
        <SlotEl className={classes} ref={ref} {...props}>
          {children}
        </SlotEl>
      );
    }

    // ── normal button ─────────────────────────────────────────────────────────
    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : leftIcon ?? null}
        {children}
        {!loading && (rightIcon ?? null)}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

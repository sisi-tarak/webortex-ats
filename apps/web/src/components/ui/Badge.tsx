import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * Badge color rules (Webortex dark theme):
 *   All badges live on dark surfaces — use semi-transparent tinted bg + matching text.
 *   Green = brand primary | Blue = brand secondary | Both use #060606 bg for inverted badges.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        /* Green — brand primary */
        default:
          "bg-[#62ba47] text-[#060606]",

        /* Blue — brand secondary */
        secondary:
          "bg-[#009dda] text-[#060606]",

        /* Outlined — dark border, light text */
        outline:
          "border border-[var(--border)] text-[var(--foreground)] bg-transparent",

        /* Muted — elevated surface, muted text */
        muted:
          "bg-[var(--muted)] text-[var(--muted-foreground)]",

        /* Success — green tint (dark-safe) */
        success:
          "bg-[#62ba47]/15 text-[#62ba47] border border-[#62ba47]/30",

        /* Warning — amber tint (dark-safe) */
        warning:
          "bg-amber-500/15 text-amber-400 border border-amber-500/30",

        /* Error — red tint (dark-safe) */
        error:
          "bg-red-500/15 text-red-400 border border-red-500/30",

        /* Premium / Pro — green → blue gradient, dark text */
        premium:
          "bg-gradient-to-r from-[#62ba47] to-[#009dda] text-[#060606] font-bold",

        /* Free tier */
        free:
          "bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]",

        /* Pro tier */
        pro:
          "bg-gradient-to-r from-[#62ba47] to-[#009dda] text-[#060606]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

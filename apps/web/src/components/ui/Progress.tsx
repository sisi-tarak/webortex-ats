"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  color?: string;
  showValue?: boolean;
  size?: "sm" | "default" | "lg";
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, color, showValue, size = "default", ...props }, ref) => {
  const h = { sm: "h-1.5", default: "h-2.5", lg: "h-4" }[size];
  return (
    <div className="flex items-center gap-3">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-full bg-[var(--muted)] flex-1",
          h,
          className
        )}
        {...props}
        value={value}
      >
        <ProgressPrimitive.Indicator
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            transform: `translateX(-${100 - (value || 0)}%)`,
            background: color || "var(--primary)",
          }}
        />
      </ProgressPrimitive.Root>
      {showValue && (
        <span className="text-sm font-mono font-semibold w-10 text-right text-[var(--foreground)]">
          {value}%
        </span>
      )}
    </div>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };

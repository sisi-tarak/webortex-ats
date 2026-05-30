import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Height shorthand — accepts any Tailwind h-* value like "h-4", "h-10" */
  height?: string;
  /** Width shorthand — accepts any Tailwind w-* value */
  width?: string;
  /** Render as a circle instead of a rounded rect */
  circle?: boolean;
}

export function Skeleton({ className, height, width, circle, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[#222222]",
        circle ? "rounded-full" : "rounded-md",
        height,
        width,
        className
      )}
      {...props}
    />
  );
}

// ─── Preset composites ────────────────────────────────────────────────────────

/** A full card-shaped skeleton block */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-[var(--border)] p-5 space-y-3", className)}>
      <Skeleton height="h-5" width="w-2/5" />
      <Skeleton height="h-3" width="w-full" />
      <Skeleton height="h-3" width="w-4/5" />
      <Skeleton height="h-3" width="w-3/5" />
    </div>
  );
}

/** A list-row skeleton */
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      <Skeleton height="h-10" width="w-10" circle />
      <div className="flex-1 space-y-2">
        <Skeleton height="h-4" width="w-2/5" />
        <Skeleton height="h-3" width="w-3/5" />
      </div>
    </div>
  );
}

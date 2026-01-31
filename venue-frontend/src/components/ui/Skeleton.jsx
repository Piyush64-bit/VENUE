import { cn } from "../../lib/utils";

/**
 * A Skeleton component that provides a shimmering loading effect.
 * Usage: <Skeleton className="h-4 w-[250px]" />
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-white/10", className)}
      {...props}
    />
  );
}

export { Skeleton };

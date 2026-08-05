import type { CSSProperties, ReactElement } from "react";
import { cn } from "./cn";

export type SkeletonVariant = "text" | "block" | "circle" | "card";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  /** Număr de rânduri pentru `variant="text"`. Ultimul rând e mai scurt. */
  lines?: number;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const BASE =
  "bg-surface-2 bg-[linear-gradient(100deg,transparent_20%,rgb(255_255_255/0.06)_40%,transparent_60%)] bg-[length:220%_100%] animate-sg-shimmer";

/**
 * Skeleton, nu spinner: rezervă exact spațiul conținutului real, deci nu
 * produce salt de layout (CLS) când datele sosesc.
 * `aria-hidden` + `aria-busy` pe containerul părinte e responsabilitatea paginii.
 */
export function Skeleton({
  variant = "block",
  lines = 3,
  width,
  height,
  className,
}: SkeletonProps): ReactElement {
  const style: CSSProperties = { width, height };

  if (variant === "text") {
    return (
      <div className={cn("flex flex-col gap-2", className)} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={cn(BASE, "h-3 rounded-xs")}
            style={{ width: i === lines - 1 ? "62%" : "100%" }}
          />
        ))}
      </div>
    );
  }

  if (variant === "circle") {
    return (
      <div
        aria-hidden="true"
        className={cn(BASE, "rounded-full", className)}
        style={{ width: width ?? 40, height: height ?? width ?? 40 }}
      />
    );
  }

  if (variant === "card") {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "overflow-hidden rounded-lg border border-line bg-surface p-4",
          className,
        )}
      >
        <div className={cn(BASE, "mb-4 h-28 rounded-md")} />
        <div className={cn(BASE, "mb-2 h-4 w-2/3 rounded-xs")} />
        <div className={cn(BASE, "mb-4 h-3 w-1/3 rounded-xs")} />
        <div className="flex flex-col gap-2">
          <div className={cn(BASE, "h-2 rounded-xs")} />
          <div className={cn(BASE, "h-2 rounded-xs")} />
          <div className={cn(BASE, "h-2 rounded-xs")} />
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(BASE, "rounded-md", className)}
      style={{ ...style, height: height ?? 16 }}
    />
  );
}

export default Skeleton;

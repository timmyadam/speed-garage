import type { ReactElement, ReactNode } from "react";
import { cn } from "./cn";

export interface EmptyStateProps {
  /** Iconiță Phosphor (weight `duotone` recomandat aici). */
  icon?: ReactNode;
  title: string;
  /** Spune ce lipsește și de ce, nu doar „Nimic aici". */
  description?: string;
  /** Un singur `<Button>` primar — pasul următor evident. */
  action?: ReactNode;
  /** Acțiune secundară, ca link/ghost. */
  secondaryAction?: ReactNode;
  className?: string;
}

/**
 * Formula: iconiță + explicație + o singură acțiune următoare.
 * Fundalul hașurat marchează explicit „zonă goală", nu „ecran stricat".
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps): ReactElement {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center sg-hatch",
        className,
      )}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className="mb-4 flex size-14 items-center justify-center rounded-full border border-line bg-surface-2 text-fg-3"
        >
          {icon}
        </span>
      ) : null}
      <h3 className="text-lg font-semibold text-fg">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-fg-3">
          {description}
        </p>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}

export default EmptyState;

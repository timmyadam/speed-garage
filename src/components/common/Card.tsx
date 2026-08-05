import type { ElementType, ReactElement, ReactNode } from "react";
import { cn } from "./cn";

export type CardVariant = "default" | "raised" | "inset" | "accent";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps {
  children: ReactNode;
  /** Titlu de secțiune. Randează un antet cu separator. */
  title?: ReactNode;
  /** Acțiune în dreapta titlului (buton mic, link). */
  action?: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  /** Colț teșit sus-dreapta — semnătura vizuală. Folosește-l cu măsură. */
  chamfer?: boolean;
  /** Marchează cardul ca zonă de hover (folosit când e înfășurat într-un link). */
  interactive?: boolean;
  /** Element HTML randat. Preferă `section` / `article` unde e semantic corect. */
  as?: ElementType;
  className?: string;
}

const VARIANT: Record<CardVariant, string> = {
  // Adâncimea în dark mode vine din trepte de luminozitate, nu din umbre.
  default: "bg-surface border-line",
  raised: "bg-surface-2 border-line-strong",
  inset: "bg-bg border-line",
  accent: "bg-accent-wash border-accent-line",
};

const PADDING: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  children,
  title,
  action,
  variant = "default",
  padding = "md",
  chamfer = false,
  interactive = false,
  as,
  className,
}: CardProps): ReactElement {
  const Tag: ElementType = as ?? "div";

  return (
    <Tag
      className={cn(
        "relative border",
        chamfer ? "sg-chamfer rounded-none" : "rounded-lg",
        VARIANT[variant],
        interactive &&
          "transition-colors duration-150 ease-out-quick hover:border-line-strong hover:bg-surface-2",
        className,
      )}
    >
      {title ? (
        <div
          className={cn(
            "flex items-center justify-between gap-3 border-b border-line",
            padding === "lg" ? "px-6 py-4" : "px-4 py-3",
          )}
        >
          <h2 className="min-w-0 truncate text-sm font-semibold uppercase tracking-[0.08em] text-fg-2">
            {title}
          </h2>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={PADDING[padding]}>{children}</div>
    </Tag>
  );
}

export default Card;

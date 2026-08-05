"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { XIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "./cn";

export type ModalTone = "neutral" | "win" | "lose" | "accent";
export type ModalSize = "sm" | "md" | "lg";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Titlul devine numele accesibil al dialogului. Obligatoriu. */
  title: string;
  /** Subtitlu scurt sub titlu (ex: "Cursă câștigată · Etapa 3"). */
  description?: string;
  children: ReactNode;
  /** Zona de acțiuni de jos. Un singur buton primar. */
  footer?: ReactNode;
  size?: ModalSize;
  /** Colorează banda de sus — feedback instant câștig/pierdere. */
  tone?: ModalTone;
  /** Implicit `true`. Dezactivează-l pentru rezultate care cer o alegere. */
  closeOnBackdrop?: boolean;
  /** Ascunde butonul „închide" (ex: modal de rezultat cu acțiune obligatorie). */
  hideCloseButton?: boolean;
}

const SIZE: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

const TONE_BAR: Record<ModalTone, string> = {
  neutral: "bg-line-strong",
  win: "bg-win",
  lose: "bg-lose",
  accent: "bg-accent",
};

/**
 * `false` la randarea pe server și în timpul hidratării, `true` după.
 * Portalul are nevoie de `document.body`, care nu există pe server —
 * fără asta, un `<Modal open>` randat pe server ar arunca eroare.
 */
const subscribeToNothing = () => () => {};
const useIsClient = (): boolean =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  tone = "neutral",
  closeOnBackdrop = true,
  hideCloseButton = false,
}: ModalProps): ReactElement | null {
  const isClient = useIsClient();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  // Esc închide + capcană de focus în interiorul panoului.
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const nodes = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (nodes.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown, true);

    // Focus pe panou, nu pe primul buton: cititorul de ecran anunță întâi titlul.
    const raf = requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      returnFocusRef.current?.focus();
    };
  }, [open, onKeyDown]);

  if (!isClient || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        aria-hidden="true"
        onClick={closeOnBackdrop ? onClose : undefined}
        className="absolute inset-0 bg-black/72 backdrop-blur-[2px] animate-sg-overlay-in"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden border border-line-strong bg-surface-3 shadow-[0_24px_60px_-12px_rgb(0_0_0/0.7)] outline-none animate-sg-panel-in",
          "rounded-t-xl sm:rounded-xl",
          SIZE[size],
        )}
      >
        {/* Banda de tonalitate: rezultatul se citește înainte de orice cuvânt. */}
        <div className={cn("h-1 w-full shrink-0", TONE_BAR[tone])} />

        <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 sm:px-6">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-xl font-bold uppercase tracking-[-0.01em] text-fg sm:text-2xl"
            >
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-1 text-sm text-fg-3">
                {description}
              </p>
            ) : null}
          </div>

          {!hideCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Închide fereastra"
              className="-mr-1 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-md text-fg-3 transition-colors duration-150 hover:bg-surface-2 hover:text-fg"
            >
              <XIcon weight="bold" className="size-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">
          {children}
        </div>

        {footer ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-line bg-surface-2/60 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;

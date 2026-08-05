import type { CSSProperties, ReactElement } from "react";
import { cn } from "../common/cn";
import type { Rarity } from "../common/RarityBadge";

export interface CarSilhouetteProps {
  /** Culoarea mașinii (hex/rgb). Din ea derivă tot: caroserie, jante, halou. */
  accentColor: string;
  rarity?: Rarity;
  /** Numele mașinii — devine textul alternativ al imaginii. */
  alt: string;
  /** Estompează totul (mașină neposedată / blocată). */
  muted?: boolean;
  className?: string;
}

/**
 * „Fotografia" mașinii, construită integral din CSS.
 *
 * Nu e un dreptunghi colorat: e un profil lateral de coupé tăiat din poligoane,
 * cu geamuri reci, dungă de livery înclinată, hairline de umăr, roți cu butuc
 * în culoarea mașinii și umbră de contact cu asfaltul. Zero rețea, zero CLS —
 * randează identic la orice lățime pentru că totul e procentual.
 */
export function CarSilhouette({
  accentColor,
  rarity = "common",
  alt,
  muted = false,
  className,
}: CarSilhouetteProps): ReactElement {
  const style = { "--car-accent": accentColor } as CSSProperties;

  return (
    <div
      role="img"
      aria-label={alt}
      style={style}
      className={cn(
        "sg-car overflow-hidden",
        muted && "opacity-45 saturate-50",
        className,
      )}
    >
      {/* Podeaua de garaj: grilă statică + o singură fâșie de lumină rece. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 sg-grid opacity-70"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 55%, transparent 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background: `linear-gradient(to top, color-mix(in oklab, var(--color-${rarity}) 16%, transparent), transparent)`,
        }}
      />

      <div className="sg-car__glow" aria-hidden="true" />

      <div className="sg-car__stage" aria-hidden="true">
        <div className="sg-car__body">
          <div className="sg-car__stripe" />
          <div className="sg-car__shoulder" />
          <div className="sg-car__arch sg-car__arch--front" />
          <div className="sg-car__arch sg-car__arch--rear" />
        </div>
        <div className="sg-car__glass" />
        <div className="sg-car__wheel sg-car__wheel--front" />
        <div className="sg-car__wheel sg-car__wheel--rear" />
        <div className="sg-car__contact" />
      </div>
    </div>
  );
}

export default CarSilhouette;

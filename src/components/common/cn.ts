/**
 * Concatenare de clase, minimalistă. Nu avem nevoie de `clsx`/`tailwind-merge`:
 * componentele din design system nu se suprascriu între ele, iar `className`
 * primit din exterior vine mereu ultimul.
 */
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}

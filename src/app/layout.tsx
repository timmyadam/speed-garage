import type { Metadata, Viewport } from "next";
import { Inter, Saira_Condensed } from "next/font/google";
import { AppFrame, GlobalFeedback, StoreHydrator } from "@/components/providers";
import "./globals.css";

/**
 * Inter — text de interfață. Densitate mare de informație, x-height generos,
 * cifre tabulare native (`tnum`). Face treaba pentru 90% din UI.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/**
 * Saira Condensed — fața tehnică pentru cifre, timpi, viteze și titluri.
 * Condensată și ușor pătrată: încap 4 cifre de RPM într-un gauge îngust
 * fără să scadă lizibilitatea, iar caracterul de „ecran de cronometraj"
 * vine din tipografie, nu din decorațiuni.
 */
const sairaCondensed = Saira_Condensed({
  variable: "--font-saira",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Speed Garage",
    template: "%s — Speed Garage",
  },
  description:
    "Colecționează mașini, câștigă drag race-uri, duelează statistici și răspunde la quiz-uri auto. Progresul se salvează local, în browser.",
  applicationName: "Speed Garage",
  openGraph: {
    title: "Speed Garage",
    description:
      "Garaj, drag race, duel de statistici și quiz auto — un joc care rulează integral în browser.",
    type: "website",
    locale: "ro_RO",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ro"
      className={`${inter.variable} ${sairaCondensed.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-bg text-fg font-sans">
        {/* Hidratarea profilului din localStorage — o singură dată, aici. */}
        <StoreHydrator />
        <AppFrame>{children}</AppFrame>
        <GlobalFeedback />
      </body>
    </html>
  );
}

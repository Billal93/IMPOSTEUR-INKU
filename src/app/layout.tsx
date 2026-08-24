import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { InkuWatermark } from "@/components/InkuWatermark";

/** Clash Display — la face d'affichage de la marque. Axe variable 200→700. */
const display = localFont({
  variable: "--font-display-src",
  src: [
    { path: "../../public/fonts/ClashDisplay-Variable.woff2", weight: "200 700", style: "normal" },
    { path: "../../public/fonts/ClashDisplay-Variable.woff", weight: "200 700", style: "normal" },
  ],
  display: "swap",
});

/** Urbanist — la face de texte courant. */
const body = localFont({
  variable: "--font-body-src",
  src: [
    { path: "../../public/fonts/Urbanist-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Urbanist-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/Urbanist-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/Urbanist-Bold.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "IMPOSTEUR",
  description:
    "Le jeu social anime & manga. Un mot, des indices, un imposteur. Trouve-le avant qu'il te trouve.",
  applicationName: "IMPOSTEUR",
  openGraph: {
    title: "IMPOSTEUR",
    description: "Un mot, des indices, un imposteur. Joue avec tes potes, sans installer quoi que ce soit.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0d12" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

/** Applique le thème avant le premier paint pour éviter le flash. */
const themeScript = `(function(){try{var t=localStorage.getItem("imposteur:theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(t==="dark"){document.documentElement.classList.add("dark");}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${display.variable} ${body.variable} antialiased`}>
        {children}
        <InkuWatermark />
      </body>
    </html>
  );
}

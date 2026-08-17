import type { Metadata, Viewport } from "next";
import { Baloo_2, Inter } from "next/font/google";
import "./globals.css";
import { InkuWatermark } from "@/components/InkuWatermark";

const display = Baloo_2({
  variable: "--font-display-src",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body-src",
  subsets: ["latin"],
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

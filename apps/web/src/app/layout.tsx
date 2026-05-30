import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://ats.webortex.com"
  ),
  title: {
    default: "Webortex ATS Resume — Build Resumes That Beat Every ATS Scanner",
    template: "%s | Webortex ATS Resume",
  },
  description:
    "Create ATS-optimized resumes powered by LaTeX. Get your ATS score, fix keyword gaps, and land more interviews. Free to start.",
  keywords: [
    "ATS resume",
    "ATS resume builder",
    "ATS score checker",
    "LaTeX resume",
    "resume builder India",
    "ATS friendly resume",
    "resume keywords",
    "job application resume",
  ],
  authors: [{ name: "Webortex" }],
  creator: "Webortex",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://ats.webortex.com",
    siteName: "Webortex ATS Resume",
    title: "Build Resumes That Beat Every ATS Scanner",
    description:
      "LaTeX-powered ATS resume builder with real-time score checking. Used by 10,000+ job seekers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Webortex ATS Resume Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Webortex ATS Resume Builder",
    description: "Build resumes that beat every ATS scanner.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="top-right"
          richColors
          expand
          toastOptions={{
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}

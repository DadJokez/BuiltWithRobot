import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Things we build together — one human, one AI, shipped for real. Projects built through human-AI collaboration, plus a fresh retro-futurist doodle every day.";

export const metadata: Metadata = {
  title: {
    default: "Built With Robot",
    template: "%s · Built With Robot",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "Built With Robot",
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Built With Robot",
    description: DESCRIPTION,
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
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-[#0a0a0a] text-white font-sans">
        {children}
      </body>
    </html>
  );
}

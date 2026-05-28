import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Toaster from "@/components/Toaster";
import BottomNav from "@/components/BottomNav";
import ScrollToTop from "@/components/ScrollToTop";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Pentagram", template: "%s · Pentagram" },
  description: "AI image generation and social sharing",
  openGraph: {
    title: "Pentagram",
    description: "Generate and share AI images",
    type: "website",
    siteName: "Pentagram",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pentagram",
    description: "Generate and share AI images",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased pb-14 sm:pb-0`}>
          {children}
          <Toaster />
          <BottomNav />
          <ScrollToTop />
        </body>
      </html>
    </ClerkProvider>
  );
}

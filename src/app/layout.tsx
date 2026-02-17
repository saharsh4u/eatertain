import type { Metadata } from "next";
import { Lobster, Shrikhand, Space_Grotesk } from "next/font/google";
import "./globals.css";

const displayFont = Shrikhand({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const accentFont = Lobster({
  subsets: ["latin"],
  variable: "--font-accent",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Eatertain | Zero scrolling. Three perfect picks.",
  description: "Tell Eatertain what you are eating and get three context-first picks instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${accentFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

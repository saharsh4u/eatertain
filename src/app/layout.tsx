import type { Metadata } from "next";
import { Fraunces, Lobster, Nunito } from "next/font/google";
import "./globals.css";

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
});

const bodyFont = Nunito({
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

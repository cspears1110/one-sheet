import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bravuraText = localFont({
  src: "../public/fonts/BravuraText.otf",
  variable: "--font-bravura-text",
  display: "swap", // Ensures fallback font is used until this one loads, but preloads guarantee no FOUT
});

export const metadata: Metadata = {
  title: "OneSheet",
  description: "OneSheet is a tool for creating form diagrams for music",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bravuraText.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

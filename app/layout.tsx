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

export const metadata: Metadata = {
  title: {
    default: "LocalStream | The Ultimate Local Video Player",
    template: "%s | LocalStream",
  },
  description: "Turn your scattered local video files into a gorgeous, premium streaming platform right in your browser. 100% free, private, and no accounts required.",
  keywords: ["video player", "local stream", "course player", "offline video player", "browser video player", "file system access api", "offline streaming"],
  authors: [{ name: "Aman Goyal", url: "https://github.com/amngoyal" }],
  creator: "Aman Goyal",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://localstream.vercel.app/",
    title: "LocalStream | The Ultimate Local Video Player",
    description: "Turn your scattered local video files into a gorgeous, premium streaming platform right in your browser.",
    siteName: "LocalStream",
  },
  twitter: {
    card: "summary_large_image",
    title: "LocalStream | The Ultimate Local Video Player",
    description: "Turn your scattered local video files into a gorgeous, premium streaming platform right in your browser.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

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
  title: "FreshLi4 - 新鲜李四游戏工作室",
  description:
    "FreshLi4 creates fresh, tactile original games, starting with the cyberpunk ARPG roguelite Dive Up.",
  metadataBase: new URL("https://www.freshli4.com"),
  openGraph: {
    title: "FreshLi4 - 新鲜李四游戏工作室",
    description:
      "A one-page studio site for FreshLi4, built around game-first vertical bento blocks.",
    url: "https://www.freshli4.com",
    siteName: "FreshLi4",
    images: [
      {
        url: "/diveup-cover.jpg",
        width: 1800,
        height: 1013,
        alt: "FreshLi4 Dive Up artwork",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FreshLi4 - 新鲜李四游戏工作室",
    description:
      "FreshLi4 creates fresh, tactile original games, starting with Dive Up.",
    images: ["/diveup-cover.jpg"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

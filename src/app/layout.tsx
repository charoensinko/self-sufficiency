import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/sonner";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-sans",
  subsets: ["thai", "latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "เกษียณสุข",
    template: "%s | เกษียณสุข",
  },
  description:
    "แอปคู่ใจวางแผนเกษียณสู่วิถีเกษตรพอเพียง — เลือกซื้อที่ดิน คุมงบประมาณ ปรึกษา AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "เกษียณสุข",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4a7c50",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${notoSansThai.variable} ${geistMono.variable} antialiased`}
      >
        <Sidebar />
        <AppShell>{children}</AppShell>
        <BottomNav />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}

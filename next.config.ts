import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  fallbacks: {
    // หน้าแสดงเมื่อออฟไลน์และไม่มี cache ของหน้านั้น
    document: "/~offline",
  },
});

const nextConfig: NextConfig = {
  images: {
    // รูปในแอปเสิร์ฟผ่าน signed URL ของ Supabase Storage
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default withPWA(nextConfig);

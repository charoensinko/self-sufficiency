import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "เกษียณสุข — สู่วิถีเกษตรพอเพียง",
    short_name: "เกษียณสุข",
    description:
      "แอปคู่ใจวางแผนเกษียณสู่วิถีเกษตรพอเพียง — เลือกซื้อที่ดิน คุมงบประมาณ ปรึกษา AI",
    lang: "th",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf4",
    theme_color: "#4a7c50",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

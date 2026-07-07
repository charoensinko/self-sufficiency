"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchLand, fetchPhotoUrls } from "../queries";
import type { LandDetail } from "../types";
import { LandForm } from "./land-form";

export function LandEditScreen({ landId }: { landId: string }) {
  const [land, setLand] = useState<LandDetail | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const detail = await fetchLand(landId);
        const urls = await fetchPhotoUrls(
          detail.land_photos.map((p) => p.storage_path)
        );
        setLand(detail);
        setPhotoUrls(urls);
      } catch {
        setError("โหลดข้อมูลแปลงไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }
    }
    void load();
  }, [landId]);

  if (error) {
    return (
      <p role="alert" className="py-10 text-center text-destructive">
        {error}
      </p>
    );
  }

  if (!land) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon-sm" aria-label="กลับ">
          <Link href={`/land/${landId}`}>
            <ArrowLeft aria-hidden />
          </Link>
        </Button>
        <h1 className="truncate text-xl font-bold">แก้ไข: {land.name}</h1>
      </div>
      <LandForm editing={land} photoUrls={photoUrls} />
    </div>
  );
}

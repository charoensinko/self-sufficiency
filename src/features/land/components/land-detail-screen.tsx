"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deleteLand,
  fetchChecklist,
  fetchLand,
  fetchPhotoUrls,
} from "../queries";
import {
  STATUS_LABELS,
  type ChecklistItemState,
  type LandDetail,
} from "../types";
import { ChecklistTab } from "./checklist-tab";
import { LandInfoTab } from "./land-info-tab";
import { ScoreTab } from "./score-tab";

export function LandDetailScreen({ landId }: { landId: string }) {
  const router = useRouter();
  const [land, setLand] = useState<LandDetail | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItemState[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const detail = await fetchLand(landId);
      const [urls, items] = await Promise.all([
        fetchPhotoUrls(detail.land_photos.map((p) => p.storage_path)),
        fetchChecklist(landId),
      ]);
      setLand(detail);
      setPhotoUrls(urls);
      setChecklist(items);
    } catch {
      setError("โหลดข้อมูลแปลงไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }, [landId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteLand(landId);
      toast.success("ลบแปลงที่ดินแล้ว");
      router.push("/land");
      router.refresh();
    } catch {
      toast.error("ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !land) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p role="alert" className="text-destructive">
          {error ?? "ไม่พบแปลงที่ดินนี้"}
        </p>
        <Button asChild variant="outline">
          <Link href="/land">กลับหน้ารายการ</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon-sm" aria-label="กลับ">
          <Link href="/land">
            <ArrowLeft aria-hidden />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{land.name}</h1>
          <Badge variant="secondary">{STATUS_LABELS[land.status]}</Badge>
        </div>
        <Button asChild variant="outline" size="icon" aria-label="แก้ไขแปลง">
          <Link href={`/land/${land.id}/edit`}>
            <Pencil aria-hidden />
          </Link>
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="ลบแปลง"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="grid h-12 w-full grid-cols-3">
          <TabsTrigger value="info" className="text-base">
            ข้อมูล
          </TabsTrigger>
          <TabsTrigger value="score" className="text-base">
            คะแนน
          </TabsTrigger>
          <TabsTrigger value="checklist" className="text-base">
            เช็คลิสต์
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <LandInfoTab land={land} photoUrls={photoUrls} />
        </TabsContent>

        <TabsContent value="score" className="mt-4">
          <ScoreTab
            landId={land.id}
            score={land.land_scores}
            onSaved={reload}
          />
        </TabsContent>

        <TabsContent value="checklist" className="mt-4">
          <ChecklistTab
            key={checklist.map((i) => `${i.template.id}${i.checked}`).join()}
            landId={land.id}
            initialItems={checklist}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ลบแปลง “{land.name}” หรือไม่</DialogTitle>
            <DialogDescription className="text-base">
              ข้อมูลคะแนน เช็คลิสต์ และรูปภาพของแปลงนี้จะถูกลบทั้งหมด
              และเรียกคืนไม่ได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "กำลังลบ..." : "ลบแปลงนี้"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

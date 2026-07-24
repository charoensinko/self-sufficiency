"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { todayInputValue } from "@/lib/format";
import type { JournalEntry, JournalInput } from "../types";

type NewPhoto = { file: File; previewUrl: string };

/** ฟอร์มเพิ่ม/แก้ไขบันทึก — ถ้ามี entry คือแก้ไข (ลบได้) */
export function EntryDialog({
  open,
  entry,
  photoUrls,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  entry: JournalEntry | null;
  photoUrls: Map<string, string>;
  onOpenChange: (open: boolean) => void;
  onSave: (
    input: JournalInput,
    keptPaths: string[],
    newFiles: File[]
  ) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [entryDate, setEntryDate] = useState(todayInputValue());
  const [content, setContent] = useState("");
  const [keptPaths, setKeptPaths] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setEntryDate(entry?.entry_date ?? todayInputValue());
      setContent(entry?.content ?? "");
      setKeptPaths(entry?.photo_paths ?? []);
      setConfirmDelete(false);
    } else {
      // ปิด dialog: คืน object URL ของรูปที่เลือกค้างไว้แล้วล้างรายการ
      setNewPhotos((prev) => {
        for (const photo of prev) URL.revokeObjectURL(photo.previewUrl);
        return [];
      });
    }
  }, [open, entry]);

  function handlePickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    if (files.length === 0) return;
    setNewPhotos((prev) => [
      ...prev,
      ...files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await onSave(
        { entry_date: entryDate, content: content.trim() },
        keptPaths,
        newPhotos.map((p) => p.file)
      );
      onOpenChange(false);
    } catch {
      // parent แสดง toast แล้ว — คง dialog ไว้ให้ลองใหม่
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    try {
      await onDelete();
      onOpenChange(false);
    } catch {
      // parent แสดง toast แล้ว
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {entry ? "แก้ไขบันทึก" : "เขียนบันทึกใหม่"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entry-date">วันที่</Label>
            <Input
              id="entry-date"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="h-12 text-base"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entry-content">วันนี้ทำอะไร เป็นอย่างไรบ้าง</Label>
            <Textarea
              id="entry-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="เช่น ไปดูแปลงที่โคราช คุยกับเจ้าของที่..."
              className="text-base"
              required
            />
          </div>

          {/* รูปแนบ: รูปเดิมที่เก็บไว้ + รูปใหม่ที่เพิ่งเลือก */}
          <div className="space-y-2">
            <Label>รูปภาพ (ไม่บังคับ)</Label>
            <div className="grid grid-cols-3 gap-2">
              {keptPaths.map((path) => {
                const url = photoUrls.get(path);
                return (
                  <div key={path} className="relative aspect-square">
                    {url && (
                      <Image
                        src={url}
                        alt="รูปแนบ"
                        fill
                        sizes="150px"
                        className="rounded-lg object-cover"
                      />
                    )}
                    <button
                      type="button"
                      aria-label="ลบรูปนี้"
                      onClick={() =>
                        setKeptPaths((prev) => prev.filter((p) => p !== path))
                      }
                      className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-1 text-white shadow"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>
                );
              })}
              {newPhotos.map((photo, index) => (
                <div key={photo.previewUrl} className="relative aspect-square">
                  {/* รูปรออัปโหลดเป็น object URL ชั่วคราว ใช้ next/image ไม่ได้ */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.previewUrl}
                    alt="รูปที่เลือกใหม่"
                    className="size-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    aria-label="เอารูปนี้ออก"
                    onClick={() =>
                      setNewPhotos((prev) => {
                        URL.revokeObjectURL(photo.previewUrl);
                        return prev.filter((_, i) => i !== index);
                      })
                    }
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-1 text-white shadow"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-sm text-muted-foreground hover:bg-muted"
              >
                <ImagePlus className="size-6" aria-hidden />
                เพิ่มรูป
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePickFiles}
              className="hidden"
            />
          </div>

          <div className="flex gap-2">
            {entry && onDelete && (
              <Button
                type="button"
                variant={confirmDelete ? "destructive" : "outline"}
                onClick={handleDelete}
                disabled={saving}
              >
                {confirmDelete ? "ยืนยันลบ?" : "ลบบันทึก"}
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
              disabled={saving || !content.trim()}
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { NotebookPen, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { addEntry, deleteEntry, fetchEntries, fetchJournalPhotoUrls, updateEntry } from "../queries";
import { formatDayThai, formatMonthThai } from "../types";
import type { JournalEntry, JournalInput } from "../types";
import { EntryDialog } from "./entry-dialog";

export function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const allEntries = await fetchEntries();
      const urls = await fetchJournalPhotoUrls(
        allEntries.flatMap((e) => e.photo_paths)
      );
      setEntries(allEntries);
      setPhotoUrls(urls);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // จัดกลุ่มรายเดือน (entries เรียงวันที่ล่าสุดก่อนอยู่แล้ว)
  const monthGroups = useMemo(() => {
    const groups: { month: string; items: JournalEntry[] }[] = [];
    for (const entry of entries) {
      const month = formatMonthThai(entry.entry_date);
      const last = groups[groups.length - 1];
      if (last && last.month === month) last.items.push(entry);
      else groups.push({ month, items: [entry] });
    }
    return groups;
  }, [entries]);

  async function handleSave(
    input: JournalInput,
    keptPaths: string[],
    newFiles: File[]
  ) {
    try {
      if (editingEntry) {
        await updateEntry(editingEntry, input, keptPaths, newFiles);
      } else {
        await addEntry(input, newFiles);
      }
      await reload();
      toast.success("บันทึกแล้ว");
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่");
      throw new Error("save failed");
    }
  }

  async function handleDelete() {
    if (!editingEntry) return;
    try {
      await deleteEntry(editingEntry);
      await reload();
      toast.success("ลบบันทึกแล้ว");
    } catch {
      toast.error("ลบไม่สำเร็จ กรุณาลองใหม่");
      throw new Error("delete failed");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="py-10 text-center text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <Button
        className="w-full lg:w-auto"
        onClick={() => {
          setEditingEntry(null);
          setDialogOpen(true);
        }}
      >
        <Plus aria-hidden />
        เขียนบันทึกใหม่
      </Button>

      {entries.length === 0 && (
        <div className="space-y-2 py-10 text-center text-muted-foreground">
          <NotebookPen className="mx-auto size-10" aria-hidden />
          <p>ยังไม่มีบันทึก — เริ่มเขียนเรื่องราวของสวนเราได้เลย</p>
        </div>
      )}

      {monthGroups.map((group) => (
        <section key={group.month} className="space-y-3">
          <h2 className="text-lg font-semibold">{group.month}</h2>
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
            {group.items.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">
                      {formatDayThai(entry.entry_date)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="แก้ไขบันทึกนี้"
                      onClick={() => {
                        setEditingEntry(entry);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil aria-hidden />
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {entry.content}
                  </p>
                  {entry.photo_paths.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {entry.photo_paths.map((path) => {
                        const url = photoUrls.get(path);
                        if (!url) return null;
                        return (
                          <a
                            key={path}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative block aspect-square"
                          >
                            <Image
                              src={url}
                              alt="รูปในบันทึก"
                              fill
                              sizes="150px"
                              className="rounded-lg object-cover"
                            />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <EntryDialog
        open={dialogOpen}
        entry={editingEntry}
        photoUrls={photoUrls}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        onDelete={editingEntry ? handleDelete : undefined}
      />
    </div>
  );
}

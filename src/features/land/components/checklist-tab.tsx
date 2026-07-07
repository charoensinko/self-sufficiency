"use client";

import { useMemo, useState } from "react";
import { NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { saveChecklistItem } from "../queries";
import type { ChecklistItemState } from "../types";

export function ChecklistTab({
  landId,
  initialItems,
}: {
  landId: string;
  initialItems: ChecklistItemState[];
}) {
  const [items, setItems] = useState(initialItems);
  const [openNotes, setOpenNotes] = useState<Set<string>>(
    () =>
      new Set(
        initialItems
          .filter((item) => item.note)
          .map((item) => item.template.id)
      )
  );

  const groups = useMemo(() => {
    const byCategory = new Map<string, ChecklistItemState[]>();
    for (const item of items) {
      const list = byCategory.get(item.template.category) ?? [];
      list.push(item);
      byCategory.set(item.template.category, list);
    }
    return [...byCategory.entries()];
  }, [items]);

  const doneCount = items.filter((item) => item.checked).length;

  function patchItem(templateId: string, patch: Partial<ChecklistItemState>) {
    setItems((prev) =>
      prev.map((item) =>
        item.template.id === templateId ? { ...item, ...patch } : item
      )
    );
  }

  async function handleToggle(item: ChecklistItemState, checked: boolean) {
    patchItem(item.template.id, { checked });
    try {
      await saveChecklistItem(landId, item.template.id, {
        checked,
        note: item.note,
      });
    } catch {
      patchItem(item.template.id, { checked: !checked });
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  async function handleNoteBlur(item: ChecklistItemState) {
    try {
      await saveChecklistItem(landId, item.template.id, {
        checked: item.checked,
        note: item.note,
      });
    } catch {
      toast.error("บันทึกโน้ตไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="font-medium">ตรวจแล้ว</span>
            <span className="text-lg font-bold">
              {doneCount}/{items.length} ข้อ
            </span>
          </div>
          <Progress
            value={items.length > 0 ? (doneCount / items.length) * 100 : 0}
            className="h-3"
          />
        </CardContent>
      </Card>

      {groups.map(([category, groupItems]) => {
        const groupDone = groupItems.filter((item) => item.checked).length;
        return (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {category} ({groupDone}/{groupItems.length})
              </CardTitle>
              <Progress
                value={(groupDone / groupItems.length) * 100}
                className="h-2"
              />
            </CardHeader>
            <CardContent className="divide-y">
              {groupItems.map((item) => {
                const noteOpen = openNotes.has(item.template.id);
                return (
                  <div key={item.template.id} className="space-y-2 py-3">
                    <div className="flex items-start gap-3">
                      <Switch
                        checked={item.checked}
                        onCheckedChange={(checked) =>
                          handleToggle(item, checked)
                        }
                        aria-label={item.template.item}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "font-medium",
                            item.checked && "text-muted-foreground line-through"
                          )}
                        >
                          {item.template.item}
                        </p>
                        {item.template.description && (
                          <p className="text-sm text-muted-foreground">
                            {item.template.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="เขียนโน้ต"
                        className={cn(item.note && "text-primary")}
                        onClick={() =>
                          setOpenNotes((prev) => {
                            const next = new Set(prev);
                            if (next.has(item.template.id)) {
                              next.delete(item.template.id);
                            } else {
                              next.add(item.template.id);
                            }
                            return next;
                          })
                        }
                      >
                        <NotebookPen aria-hidden />
                      </Button>
                    </div>
                    {noteOpen && (
                      <Textarea
                        value={item.note}
                        onChange={(e) =>
                          patchItem(item.template.id, { note: e.target.value })
                        }
                        onBlur={() => {
                          const current = items.find(
                            (i) => i.template.id === item.template.id
                          );
                          if (current) void handleNoteBlur(current);
                        }}
                        placeholder="โน้ตเพิ่มเติม เช่น ผลที่ตรวจพบ"
                        rows={2}
                        className="text-base"
                      />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

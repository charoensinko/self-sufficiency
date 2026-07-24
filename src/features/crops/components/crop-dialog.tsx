"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CROP_CATEGORIES,
  THAI_MONTHS_SHORT,
  WATER_NEEDS,
} from "../types";
import type { Crop, CropCategory, CropInput, WaterNeed } from "../types";

/** ฟอร์มเพิ่ม/แก้ไขพืชในฐานข้อมูล — ถ้ามี crop คือแก้ไข (ลบได้) */
export function CropDialog({
  open,
  crop,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  crop: Crop | null;
  onOpenChange: (open: boolean) => void;
  onSave: (input: CropInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CropCategory>("ผักสวนครัว");
  const [daysToHarvest, setDaysToHarvest] = useState("");
  const [spacing, setSpacing] = useState("");
  const [waterNeed, setWaterNeed] = useState<WaterNeed>("ปานกลาง");
  const [months, setMonths] = useState<number[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setName(crop?.name ?? "");
      setCategory(crop?.category ?? "ผักสวนครัว");
      setDaysToHarvest(
        crop?.days_to_harvest != null ? String(crop.days_to_harvest) : ""
      );
      setSpacing(crop?.spacing ?? "");
      setWaterNeed(crop?.water_need ?? "ปานกลาง");
      setMonths(crop?.planting_months ?? []);
      setNotes(crop?.notes ?? "");
      setConfirmDelete(false);
    }
  }, [open, crop]);

  function toggleMonth(month: number) {
    setMonths((prev) =>
      prev.includes(month)
        ? prev.filter((m) => m !== month)
        : [...prev, month].sort((a, b) => a - b)
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        days_to_harvest: daysToHarvest ? Number(daysToHarvest) : null,
        spacing: spacing.trim() || null,
        water_need: waterNeed,
        planting_months: months,
        notes: notes.trim() || null,
      });
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
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{crop ? "แก้ไขพืช" : "เพิ่มพืชใหม่"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="crop-name">ชื่อพืช</Label>
            <Input
              id="crop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ผักหวานบ้าน"
              className="h-12 text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>หมวด</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as CropCategory)}
            >
              <SelectTrigger className="h-12 w-full text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CROP_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="min-h-12 text-base">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="crop-days">อายุเก็บเกี่ยว (วัน)</Label>
              <Input
                id="crop-days"
                type="number"
                min="1"
                value={daysToHarvest}
                onChange={(e) => setDaysToHarvest(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label>ต้องการน้ำ</Label>
              <Select
                value={waterNeed}
                onValueChange={(v) => setWaterNeed(v as WaterNeed)}
              >
                <SelectTrigger className="h-12 w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WATER_NEEDS.map((w) => (
                    <SelectItem
                      key={w}
                      value={w}
                      className="min-h-12 text-base"
                    >
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="crop-spacing">ระยะปลูก</Label>
            <Input
              id="crop-spacing"
              value={spacing}
              onChange={(e) => setSpacing(e.target.value)}
              placeholder="เช่น 30×30 ซม."
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label>เดือนที่เหมาะปลูก (ไม่เลือก = ปลูกได้ทั้งปี)</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {THAI_MONTHS_SHORT.map((label, index) => {
                const month = index + 1;
                const selected = months.includes(month);
                return (
                  <button
                    key={month}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleMonth(month)}
                    className={cn(
                      "h-11 rounded-lg border text-sm font-medium transition-colors",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="crop-notes">เคล็ดลับ/หมายเหตุ (ไม่บังคับ)</Label>
            <Textarea
              id="crop-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-base"
            />
          </div>

          <div className="flex gap-2">
            {crop && onDelete && (
              <Button
                type="button"
                variant={confirmDelete ? "destructive" : "outline"}
                onClick={handleDelete}
                disabled={saving}
              >
                {confirmDelete ? "ยืนยันลบ?" : "ลบ"}
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
              disabled={saving || !name.trim()}
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
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
import { formatDateThai, todayInputValue } from "@/lib/format";
import { computeExpectedHarvest, PLANTING_STATUS_LABELS } from "../types";
import type {
  Crop,
  PlantingInput,
  PlantingStatus,
  PlantingWithCrop,
} from "../types";

/** ฟอร์มเพิ่ม/แก้ไขแผนปลูก — ถ้ามี planting คือแก้ไข (ลบได้) */
export function PlantingDialog({
  open,
  planting,
  crops,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  planting: PlantingWithCrop | null;
  crops: Crop[];
  onOpenChange: (open: boolean) => void;
  onSave: (input: PlantingInput, daysToHarvest: number | null) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [cropId, setCropId] = useState("");
  const [zone, setZone] = useState("");
  const [quantity, setQuantity] = useState("");
  const [plannedDate, setPlannedDate] = useState(todayInputValue());
  const [plantedDate, setPlantedDate] = useState("");
  const [status, setStatus] = useState<PlantingStatus>("planned");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setCropId(planting?.crop_id ?? "");
      setZone(planting?.zone ?? "");
      setQuantity(planting?.quantity ?? "");
      setPlannedDate(planting?.planned_date ?? todayInputValue());
      setPlantedDate(planting?.planted_date ?? "");
      setStatus(planting?.status ?? "planned");
      setNotes(planting?.notes ?? "");
      setConfirmDelete(false);
    }
  }, [open, planting]);

  const selectedCrop = useMemo(
    () => crops.find((c) => c.id === cropId) ?? null,
    [crops, cropId]
  );

  // โชว์วันคาดเก็บเกี่ยวให้เห็นก่อนบันทึก
  const expectedHarvest = useMemo(
    () =>
      computeExpectedHarvest(
        { planted_date: plantedDate || null, planned_date: plannedDate || null },
        selectedCrop?.days_to_harvest ?? null
      ),
    [plantedDate, plannedDate, selectedCrop]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cropId) return;
    setSaving(true);
    try {
      await onSave(
        {
          crop_id: cropId,
          zone: zone.trim() || null,
          quantity: quantity.trim() || null,
          planned_date: plannedDate || null,
          planted_date:
            status === "planned" ? null : plantedDate || todayInputValue(),
          status,
          notes: notes.trim() || null,
        },
        selectedCrop?.days_to_harvest ?? null
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
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {planting ? "แก้ไขแผนปลูก" : "เพิ่มแผนปลูก"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>พืช</Label>
            <Select value={cropId} onValueChange={setCropId}>
              <SelectTrigger className="h-12 w-full text-base">
                <SelectValue placeholder="เลือกพืชที่จะปลูก" />
              </SelectTrigger>
              <SelectContent>
                {crops.map((crop) => (
                  <SelectItem
                    key={crop.id}
                    value={crop.id}
                    className="min-h-12 text-base"
                  >
                    {crop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="planting-zone">โซน/บริเวณ</Label>
              <Input
                id="planting-zone"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="เช่น แปลงผักหลังบ้าน"
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planting-qty">จำนวน</Label>
              <Input
                id="planting-qty"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="เช่น 20 ต้น"
                className="h-12 text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>สถานะ</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as PlantingStatus)}
            >
              <SelectTrigger className="h-12 w-full text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(PLANTING_STATUS_LABELS) as [
                    PlantingStatus,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                    className="min-h-12 text-base"
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="planting-planned">วันที่ตั้งใจปลูก</Label>
            <Input
              id="planting-planned"
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              className="h-12 text-base"
            />
          </div>

          {status !== "planned" && (
            <div className="space-y-2">
              <Label htmlFor="planting-planted">วันที่ปลูกจริง</Label>
              <Input
                id="planting-planted"
                type="date"
                value={plantedDate}
                onChange={(e) => setPlantedDate(e.target.value)}
                className="h-12 text-base"
              />
            </div>
          )}

          {expectedHarvest && (
            <p className="rounded-lg bg-muted p-3 text-sm">
              คาดว่าจะเก็บเกี่ยวได้ประมาณ{" "}
              <span className="font-semibold">
                {formatDateThai(expectedHarvest)}
              </span>{" "}
              (อายุเก็บเกี่ยว {selectedCrop?.days_to_harvest} วัน)
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="planting-notes">หมายเหตุ (ไม่บังคับ)</Label>
            <Textarea
              id="planting-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-base"
            />
          </div>

          <div className="flex gap-2">
            {planting && onDelete && (
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
              disabled={saving || !cropId}
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

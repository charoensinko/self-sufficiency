"use client";

import { useState } from "react";
import { Pencil, Plus, Sprout } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateThai } from "@/lib/format";
import { addPlanting, deletePlanting, updatePlanting } from "../queries";
import { PLANTING_STATUS_LABELS } from "../types";
import type { Crop, PlantingInput, PlantingWithCrop } from "../types";
import { PlantingDialog } from "./planting-dialog";

const STATUS_BADGE: Record<
  PlantingWithCrop["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  planned: "secondary",
  planted: "default",
  harvested: "outline",
  cancelled: "destructive",
};

export function PlantingsTab({
  crops,
  plantings,
  onChanged,
}: {
  crops: Crop[];
  plantings: PlantingWithCrop[];
  onChanged: () => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PlantingWithCrop | null>(null);

  async function handleSave(
    input: PlantingInput,
    daysToHarvest: number | null
  ) {
    try {
      if (editing) {
        await updatePlanting(editing.id, input, daysToHarvest);
      } else {
        await addPlanting(input, daysToHarvest);
      }
      await onChanged();
      toast.success("บันทึกแล้ว");
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่");
      throw new Error("save failed");
    }
  }

  async function handleDelete() {
    if (!editing) return;
    try {
      await deletePlanting(editing.id);
      await onChanged();
      toast.success("ลบแล้ว");
    } catch {
      toast.error("ลบไม่สำเร็จ กรุณาลองใหม่");
      throw new Error("delete failed");
    }
  }

  const active = plantings.filter((p) => p.status !== "cancelled");

  return (
    <div className="space-y-4">
      <Button
        className="w-full lg:w-auto"
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      >
        <Plus aria-hidden />
        เพิ่มแผนปลูก
      </Button>

      {active.length === 0 && (
        <div className="space-y-2 py-10 text-center text-muted-foreground">
          <Sprout className="mx-auto size-10" aria-hidden />
          <p>ยังไม่มีแผนปลูก — เริ่มจากผักอายุสั้นที่ให้ผลเร็วดูไหม</p>
        </div>
      )}

      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
        {active.map((planting) => (
          <Card key={planting.id}>
            <CardContent className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">
                  {planting.crops?.name ?? "พืช"}
                  {planting.quantity && (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      × {planting.quantity}
                    </span>
                  )}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant={STATUS_BADGE[planting.status]}>
                    {PLANTING_STATUS_LABELS[planting.status]}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`แก้ไขแผนปลูก ${planting.crops?.name ?? ""}`}
                    onClick={() => {
                      setEditing(planting);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil aria-hidden />
                  </Button>
                </div>
              </div>
              <div className="space-y-0.5 text-sm text-muted-foreground">
                {planting.zone && <p>บริเวณ: {planting.zone}</p>}
                {planting.status === "planned" && planting.planned_date && (
                  <p>ตั้งใจปลูก {formatDateThai(planting.planned_date)}</p>
                )}
                {planting.planted_date && (
                  <p>ปลูกเมื่อ {formatDateThai(planting.planted_date)}</p>
                )}
                {planting.expected_harvest_date &&
                  planting.status !== "harvested" && (
                    <p className="font-medium text-foreground">
                      คาดเก็บเกี่ยว{" "}
                      {formatDateThai(planting.expected_harvest_date)}
                    </p>
                  )}
                {planting.notes && <p>{planting.notes}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PlantingDialog
        open={dialogOpen}
        planting={editing}
        crops={crops}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
      />
    </div>
  );
}

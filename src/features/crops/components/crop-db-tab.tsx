"use client";

import { useMemo, useState } from "react";
import { Droplets, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addCrop, deleteCrop, updateCrop } from "../queries";
import { formatPlantingMonths } from "../types";
import type { Crop, CropInput } from "../types";
import { CropDialog } from "./crop-dialog";

export function CropDbTab({
  crops,
  onChanged,
}: {
  crops: Crop[];
  onChanged: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Crop | null>(null);

  const groups = useMemo(() => {
    const query = search.trim();
    const filtered = query
      ? crops.filter((c) => c.name.includes(query))
      : crops;
    const byCategory = new Map<string, Crop[]>();
    for (const crop of filtered) {
      const list = byCategory.get(crop.category) ?? [];
      list.push(crop);
      byCategory.set(crop.category, list);
    }
    return [...byCategory.entries()];
  }, [crops, search]);

  async function handleSave(input: CropInput) {
    try {
      if (editing) {
        await updateCrop(editing.id, input);
      } else {
        await addCrop(input);
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
      await deleteCrop(editing.id);
      await onChanged();
      toast.success("ลบแล้ว");
    } catch {
      // พืชที่มีแผนปลูกอยู่จะลบไม่ได้ (foreign key) — แจ้งให้เข้าใจง่าย
      toast.error("ลบไม่สำเร็จ — ถ้าพืชนี้มีแผนปลูกอยู่ ต้องลบแผนปลูกก่อน");
      throw new Error("delete failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อพืช..."
            className="h-12 pl-10 text-base"
          />
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus aria-hidden />
          เพิ่มพืช
        </Button>
      </div>

      {groups.length === 0 && (
        <p className="py-10 text-center text-muted-foreground">
          ไม่พบพืชที่ค้นหา
        </p>
      )}

      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
        {groups.map(([category, groupCrops]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {category} ({groupCrops.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {groupCrops.map((crop) => (
                <div key={crop.id} className="flex items-start gap-2 py-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="font-medium">{crop.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {crop.days_to_harvest != null &&
                        `เก็บเกี่ยว ~${crop.days_to_harvest} วัน · `}
                      ปลูก: {formatPlantingMonths(crop.planting_months)}
                    </p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Droplets className="size-3.5" aria-hidden />
                      น้ำ{crop.water_need}
                      {crop.spacing && ` · ระยะ ${crop.spacing}`}
                    </p>
                    {crop.notes && (
                      <p className="text-sm text-muted-foreground">
                        {crop.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`แก้ไข ${crop.name}`}
                    onClick={() => {
                      setEditing(crop);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil aria-hidden />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <CropDialog
        open={dialogOpen}
        crop={editing}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
      />
    </div>
  );
}

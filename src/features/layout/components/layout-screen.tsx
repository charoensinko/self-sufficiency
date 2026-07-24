"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, ImagePlus, Plus, Ruler, Save, Trash2, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  addLayout,
  deleteBgImage,
  deleteLayout,
  fetchBgImageUrl,
  fetchLandOptions,
  fetchLayouts,
  updateLayout,
  uploadBgImage,
} from "../queries";
import {
  computeStats,
  deedAreaSqm,
  starterElements,
  ZONE_CONFIG,
  ZONE_KINDS,
} from "../types";
import type {
  FarmLayout,
  LayoutDraft,
  LayoutElement,
  ZoneKind,
} from "../types";
import type { LandOption } from "../queries";
import { LayoutCanvas } from "./layout-canvas";
import { LayoutStatsCard } from "./layout-stats";

const NO_LAND = "none";

function toDraft(layout: FarmLayout): LayoutDraft {
  return {
    name: layout.name,
    land_candidate_id: layout.land_candidate_id,
    width_m: layout.width_m,
    height_m: layout.height_m,
    elements: layout.elements,
    notes: layout.notes,
    bg_image_path: layout.bg_image_path,
    bg_width_m: layout.bg_width_m,
    deed_rai: layout.deed_rai,
    deed_ngan: layout.deed_ngan,
    deed_wa: layout.deed_wa,
  };
}

export function LayoutScreen() {
  const searchParams = useSearchParams();
  const [layouts, setLayouts] = useState<FarmLayout[]>([]);
  const [landOptions, setLandOptions] = useState<LandOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LayoutDraft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteLayout, setConfirmDeleteLayout] = useState(false);
  // รูปพื้นหลัง: signed URL + สัดส่วนภาพ (กว้าง/สูง) สำหรับคำนวณความสูงบน canvas
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [bgAspect, setBgAspect] = useState<number | null>(null);
  const [uploadingBg, setUploadingBg] = useState(false);
  // โหมดตั้งสเกล: ลากเส้นอ้างอิงบน canvas แล้วกรอกความยาวจริง
  const [calibrating, setCalibrating] = useState(false);
  const [calDrawnLength, setCalDrawnLength] = useState<number | null>(null);
  const [calRealLength, setCalRealLength] = useState("");
  const bgFileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const [allLayouts, lands] = await Promise.all([
        fetchLayouts(),
        fetchLandOptions(),
      ]);
      setLayouts(allLayouts);
      setLandOptions(lands);
      return allLayouts;
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const allLayouts = await reload();
      if (allLayouts.length > 0) {
        // เปิดผังตาม ?id= (ลิงก์จากหน้ารายละเอียดแปลง) ถ้าไม่มีใช้ผังแรก
        const targetId = searchParams.get("id");
        const target =
          allLayouts.find((l) => l.id === targetId) ?? allLayouts[0];
        setSelectedId(target.id);
        setDraft(toDraft(target));
      }
    })();
    // ตั้งใจให้ทำงานครั้งเดียวตอนโหลด — ไม่ต้อง re-run เมื่อ searchParams เปลี่ยน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);

  // โหลด signed URL + สัดส่วนของรูปพื้นหลังเมื่อผังที่เลือกเปลี่ยน
  const bgPath = draft?.bg_image_path ?? null;
  useEffect(() => {
    let cancelled = false;
    if (!bgPath) {
      setBgUrl(null);
      setBgAspect(null);
      return;
    }
    void (async () => {
      const url = await fetchBgImageUrl(bgPath);
      if (cancelled) return;
      setBgUrl(url);
      if (url) {
        const img = new window.Image();
        img.onload = () => {
          if (!cancelled && img.naturalHeight > 0) {
            setBgAspect(img.naturalWidth / img.naturalHeight);
          }
        };
        img.src = url;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bgPath]);

  function patchDraft(patch: Partial<LayoutDraft>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    setDirty(true);
  }

  function patchElement(id: string, patch: Partial<LayoutElement>) {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            elements: prev.elements.map((el) =>
              el.id === id ? { ...el, ...patch } : el
            ),
          }
        : prev
    );
    setDirty(true);
  }

  async function handleSave(): Promise<boolean> {
    if (!selectedId || !draft) return false;
    setSaving(true);
    try {
      await updateLayout(selectedId, draft);
      setDirty(false);
      setLayouts((prev) =>
        prev.map((l) => (l.id === selectedId ? { ...l, ...draft } : l))
      );
      toast.success("บันทึกผังแล้ว");
      return true;
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSwitchLayout(id: string) {
    // มีแก้ไขค้าง → บันทึกให้ก่อนสลับ กันงานหาย
    if (dirty && selectedId) {
      const saved = await handleSave();
      if (!saved) return;
    }
    const layout = layouts.find((l) => l.id === id);
    if (!layout) return;
    setSelectedId(id);
    setDraft(toDraft(layout));
    setSelectedElementId(null);
    setDirty(false);
    setConfirmDeleteLayout(false);
  }

  async function handleNewLayout() {
    if (dirty && selectedId) {
      const saved = await handleSave();
      if (!saved) return;
    }
    try {
      const newDraft: LayoutDraft = {
        name: `ผังแบบที่ ${layouts.length + 1}`,
        land_candidate_id: null,
        width_m: 100,
        height_m: 80,
        elements: [],
        notes: null,
        bg_image_path: null,
        bg_width_m: null,
        deed_rai: null,
        deed_ngan: null,
        deed_wa: null,
      };
      const id = await addLayout(newDraft);
      const allLayouts = await reload();
      const created = allLayouts.find((l) => l.id === id);
      setSelectedId(id);
      setDraft(created ? toDraft(created) : newDraft);
      setSelectedElementId(null);
      setDirty(false);
      toast.success("สร้างผังใหม่แล้ว");
    } catch {
      toast.error("สร้างผังไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  async function handleDeleteLayout() {
    if (!selectedId) return;
    if (!confirmDeleteLayout) {
      setConfirmDeleteLayout(true);
      return;
    }
    try {
      if (draft?.bg_image_path) await deleteBgImage(draft.bg_image_path);
      await deleteLayout(selectedId);
      const allLayouts = await reload();
      const next = allLayouts[0] ?? null;
      setSelectedId(next?.id ?? null);
      setDraft(next ? toDraft(next) : null);
      setSelectedElementId(null);
      setDirty(false);
      setConfirmDeleteLayout(false);
      toast.success("ลบผังแล้ว");
    } catch {
      toast.error("ลบไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  function handleAddElement(kind: ZoneKind) {
    if (!draft) return;
    const config = ZONE_CONFIG[kind];
    const element: LayoutElement = {
      id: crypto.randomUUID(),
      kind,
      x: Math.max(0, draft.width_m / 2 - config.defaultSize.w / 2),
      y: Math.max(0, draft.height_m / 2 - config.defaultSize.h / 2),
      w: config.defaultSize.w,
      h: config.defaultSize.h,
      ...(config.defaultDepth != null ? { depth_m: config.defaultDepth } : {}),
    };
    patchDraft({ elements: [...draft.elements, element] });
    setSelectedElementId(element.id);
  }

  function handleDuplicateElement(element: LayoutElement) {
    if (!draft) return;
    const copy: LayoutElement = {
      ...element,
      id: crypto.randomUUID(),
      x: Math.min(element.x + 5, draft.width_m - element.w),
      y: Math.min(element.y + 5, draft.height_m - element.h),
    };
    patchDraft({ elements: [...draft.elements, copy] });
    setSelectedElementId(copy.id);
  }

  function handleRemoveElement(id: string) {
    if (!draft) return;
    patchDraft({ elements: draft.elements.filter((el) => el.id !== id) });
    setSelectedElementId(null);
  }

  /** อัปโหลด/เปลี่ยนรูปพื้นหลัง — บันทึกลง DB ทันทีกัน storage กับ DB ไม่ตรงกัน */
  async function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !draft || !selectedId) return;
    setUploadingBg(true);
    try {
      const oldPath = draft.bg_image_path;
      const path = await uploadBgImage(file);
      const next: LayoutDraft = {
        ...draft,
        bg_image_path: path,
        bg_width_m: draft.bg_width_m ?? draft.width_m,
      };
      await updateLayout(selectedId, next);
      if (oldPath) await deleteBgImage(oldPath);
      setDraft(next);
      setDirty(false);
      setLayouts((prev) =>
        prev.map((l) => (l.id === selectedId ? { ...l, ...next } : l))
      );
      toast.success("ใส่รูปพื้นหลังแล้ว — กดปุ่มตั้งสเกลเพื่อให้ขนาดตรงจริง");
    } catch {
      toast.error("อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setUploadingBg(false);
    }
  }

  async function handleBgRemove() {
    if (!draft || !selectedId || !draft.bg_image_path) return;
    try {
      const oldPath = draft.bg_image_path;
      const next: LayoutDraft = {
        ...draft,
        bg_image_path: null,
        bg_width_m: null,
      };
      await updateLayout(selectedId, next);
      await deleteBgImage(oldPath);
      setDraft(next);
      setDirty(false);
      setCalibrating(false);
      setLayouts((prev) =>
        prev.map((l) => (l.id === selectedId ? { ...l, ...next } : l))
      );
      toast.success("ลบรูปพื้นหลังแล้ว");
    } catch {
      toast.error("ลบรูปไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  /** จบการลากเส้นอ้างอิง → เปิด dialog ถามความยาวจริง */
  function handleCalibrateDone(drawnLengthM: number) {
    setCalDrawnLength(drawnLengthM);
    setCalRealLength("");
  }

  function applyCalibration() {
    if (!draft || calDrawnLength == null) return;
    const real = Number(calRealLength);
    if (!real || real <= 0) return;
    const currentWidth = draft.bg_width_m ?? draft.width_m;
    patchDraft({
      bg_width_m:
        Math.round(currentWidth * (real / calDrawnLength) * 100) / 100,
    });
    setCalDrawnLength(null);
    setCalibrating(false);
    toast.success("ตั้งสเกลรูปแล้ว — อย่าลืมกดบันทึกผัง");
  }

  const selectedElement = useMemo(
    () => draft?.elements.find((el) => el.id === selectedElementId) ?? null,
    [draft, selectedElementId]
  );

  const stats = useMemo(
    () =>
      draft
        ? computeStats(
            draft.width_m,
            draft.height_m,
            draft.elements,
            deedAreaSqm(draft)
          )
        : null,
    [draft]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-80 w-full" />
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

  if (!draft || !selectedId) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-muted-foreground">
          ยังไม่มีผังแปลง — สร้างผังแรกเพื่อทดลองวางโคก หนอง นา ตามสัดส่วน
          30:30:30:10
        </p>
        <Button onClick={handleNewLayout}>
          <Plus aria-hidden />
          สร้างผังแรก
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-5 lg:space-y-0">
      {/* ซ้าย: canvas + สัดส่วน */}
      <div className="space-y-4">
        <LayoutCanvas
          widthM={draft.width_m}
          heightM={draft.height_m}
          elements={draft.elements}
          selectedId={selectedElementId}
          bgUrl={bgUrl}
          bgWidthM={draft.bg_width_m ?? draft.width_m}
          bgHeightM={
            bgAspect ? (draft.bg_width_m ?? draft.width_m) / bgAspect : null
          }
          calibrating={calibrating}
          onSelect={setSelectedElementId}
          onMove={(id, x, y) => patchElement(id, { x, y })}
          onCalibrateDone={handleCalibrateDone}
        />
        <p className="text-center text-sm text-muted-foreground">
          {calibrating
            ? "ลากเส้นทับระยะที่รู้ความยาวจริงบนรูป เช่น แนวเขตด้านหนึ่ง แล้วกรอกความยาวจริง"
            : "แตะโซนเพื่อเลือก แล้วลากย้ายได้เลย · ปรับขนาดในแผง \"โซนที่เลือก\""}
        </p>
        <div className="hidden lg:block">{stats && <LayoutStatsCard stats={stats} />}</div>
      </div>

      {/* ขวา: จัดการผัง + เพิ่มโซน + แก้โซนที่เลือก */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">ผังแปลง</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {layouts.length > 1 && (
              <Select value={selectedId} onValueChange={handleSwitchLayout}>
                <SelectTrigger className="h-12 w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {layouts.map((layout) => (
                    <SelectItem
                      key={layout.id}
                      value={layout.id}
                      className="min-h-12 text-base"
                    >
                      {layout.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="space-y-2">
              <Label htmlFor="layout-name">ชื่อผัง</Label>
              <Input
                id="layout-name"
                value={draft.name}
                onChange={(e) => patchDraft({ name: e.target.value })}
                className="h-12 text-base"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="layout-width">กว้าง (ม.)</Label>
                <Input
                  id="layout-width"
                  type="number"
                  min="10"
                  value={draft.width_m}
                  onChange={(e) =>
                    patchDraft({ width_m: Math.max(10, Number(e.target.value) || 10) })
                  }
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="layout-height">ยาว (ม.)</Label>
                <Input
                  id="layout-height"
                  type="number"
                  min="10"
                  value={draft.height_m}
                  onChange={(e) =>
                    patchDraft({ height_m: Math.max(10, Number(e.target.value) || 10) })
                  }
                  className="h-12 text-base"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>
                เนื้อที่จริงตามโฉนด (ถ้ากรอก จะใช้คิด % แทน กว้าง×ยาว)
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["deed_rai", "ไร่"],
                    ["deed_ngan", "งาน"],
                    ["deed_wa", "ตร.วา"],
                  ] as const
                ).map(([field, unit]) => (
                  <div key={field} className="space-y-1">
                    <Input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      aria-label={`เนื้อที่ (${unit})`}
                      value={draft[field] ?? ""}
                      onChange={(e) =>
                        patchDraft({
                          [field]:
                            e.target.value === ""
                              ? null
                              : Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="h-12 text-base"
                    />
                    <p className="text-center text-xs text-muted-foreground">
                      {unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>รูปพื้นหลัง (โฉนด/ภาพดาวเทียม/สเก็ตช์)</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={uploadingBg}
                  onClick={() => bgFileRef.current?.click()}
                >
                  <ImagePlus aria-hidden />
                  {uploadingBg
                    ? "กำลังอัปโหลด..."
                    : draft.bg_image_path
                      ? "เปลี่ยนรูป"
                      : "ใส่รูปพื้นหลัง"}
                </Button>
                {draft.bg_image_path && (
                  <>
                    <Button
                      variant={calibrating ? "default" : "outline"}
                      onClick={() => setCalibrating((prev) => !prev)}
                    >
                      <Ruler aria-hidden />
                      {calibrating ? "ยกเลิกตั้งสเกล" : "ตั้งสเกลรูป"}
                    </Button>
                    <Button variant="outline" onClick={handleBgRemove}>
                      <X aria-hidden />
                      ลบรูป
                    </Button>
                  </>
                )}
              </div>
              <input
                ref={bgFileRef}
                type="file"
                accept="image/*"
                onChange={(e) => void handleBgUpload(e)}
                className="hidden"
              />
            </div>

            {landOptions.length > 0 && (
              <div className="space-y-2">
                <Label>ผูกกับแปลงที่ดิน (ถ้ามี)</Label>
                <Select
                  value={draft.land_candidate_id ?? NO_LAND}
                  onValueChange={(v) =>
                    patchDraft({
                      land_candidate_id: v === NO_LAND ? null : v,
                    })
                  }
                >
                  <SelectTrigger className="h-12 w-full text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_LAND} className="min-h-12 text-base">
                      ไม่ผูกกับแปลง
                    </SelectItem>
                    {landOptions.map((land) => (
                      <SelectItem
                        key={land.id}
                        value={land.id}
                        className="min-h-12 text-base"
                      >
                        {land.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="flex-1"
              >
                <Save aria-hidden />
                {saving ? "กำลังบันทึก..." : dirty ? "บันทึกผัง" : "บันทึกแล้ว"}
              </Button>
              <Button variant="outline" onClick={handleNewLayout}>
                <Plus aria-hidden />
                ผังใหม่
              </Button>
              <Button
                variant={confirmDeleteLayout ? "destructive" : "outline"}
                onClick={handleDeleteLayout}
              >
                <Trash2 aria-hidden />
                {confirmDeleteLayout ? "ยืนยันลบ?" : "ลบผัง"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">เพิ่มโซน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {ZONE_KINDS.map((kind) => {
                const config = ZONE_CONFIG[kind];
                return (
                  <Button
                    key={kind}
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleAddElement(kind)}
                  >
                    <span
                      aria-hidden
                      className="size-4 shrink-0 rounded-sm border"
                      style={{
                        backgroundColor: config.fill,
                        borderColor: config.stroke,
                      }}
                    />
                    <span className="truncate">{config.label}</span>
                  </Button>
                );
              })}
            </div>
            {draft.elements.length === 0 && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() =>
                  patchDraft({
                    elements: starterElements(draft.width_m, draft.height_m),
                  })
                }
              >
                <Wand2 aria-hidden />
                วางผังตัวอย่าง 30:30:30:10 ให้ก่อน
              </Button>
            )}
          </CardContent>
        </Card>

        {selectedElement && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span
                  aria-hidden
                  className="size-4 rounded-sm border"
                  style={{
                    backgroundColor: ZONE_CONFIG[selectedElement.kind].fill,
                    borderColor: ZONE_CONFIG[selectedElement.kind].stroke,
                  }}
                />
                โซนที่เลือก: {ZONE_CONFIG[selectedElement.kind].label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="el-width">กว้าง (ม.)</Label>
                  <Input
                    id="el-width"
                    type="number"
                    min="1"
                    value={selectedElement.w}
                    onChange={(e) =>
                      patchElement(selectedElement.id, {
                        w: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="el-height">ยาว (ม.)</Label>
                  <Input
                    id="el-height"
                    type="number"
                    min="1"
                    value={selectedElement.h}
                    onChange={(e) =>
                      patchElement(selectedElement.id, {
                        h: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="h-12 text-base"
                  />
                </div>
              </div>
              {(selectedElement.kind === "pond" ||
                selectedElement.kind === "khok") && (
                <div className="space-y-2">
                  <Label htmlFor="el-depth">
                    {selectedElement.kind === "pond"
                      ? "ความลึกสระ (ม.)"
                      : "ความสูงดินถม (ม.)"}
                  </Label>
                  <Input
                    id="el-depth"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={selectedElement.depth_m ?? ""}
                    onChange={(e) =>
                      patchElement(selectedElement.id, {
                        depth_m: Math.max(0.5, Number(e.target.value) || 0.5),
                      })
                    }
                    className="h-12 text-base"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleDuplicateElement(selectedElement)}
                >
                  <Copy aria-hidden />
                  คัดลอก
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleRemoveElement(selectedElement.id)}
                >
                  <Trash2 aria-hidden />
                  ลบโซนนี้
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="lg:hidden">{stats && <LayoutStatsCard stats={stats} />}</div>
      </div>

      {/* dialog ถามความยาวจริงของเส้นอ้างอิงที่ลาก */}
      <Dialog
        open={calDrawnLength != null}
        onOpenChange={(open) => {
          if (!open) setCalDrawnLength(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>เส้นที่ลากยาวจริงกี่เมตร?</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyCalibration();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="cal-length">ความยาวจริง (เมตร)</Label>
              <Input
                id="cal-length"
                type="number"
                min="0.1"
                step="0.1"
                inputMode="decimal"
                value={calRealLength}
                onChange={(e) => setCalRealLength(e.target.value)}
                placeholder="เช่น 40"
                className="h-12 text-base"
                autoFocus
                required
              />
              <p className="text-sm text-muted-foreground">
                ระบบจะย่อ/ขยายรูปพื้นหลังให้ระยะบนรูปตรงกับความยาวจริงนี้
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!calRealLength || Number(calRealLength) <= 0}
            >
              ตั้งสเกล
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, ImagePlus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { parseGoogleMapsLink } from "../maps";
import {
  deleteLandPhoto,
  insertLand,
  updateLand,
  uploadLandPhotos,
  type LandInput,
} from "../queries";
import {
  DEED_TYPES,
  LAND_STATUSES,
  PHOTO_TYPES,
  STATUS_LABELS,
  type LandDetail,
  type LandStatus,
  type PhotoType,
} from "../types";

type PendingPhoto = { file: File; type: PhotoType; previewUrl: string };

export function LandForm({
  editing,
  photoUrls,
}: {
  /** ถ้ามีค่า = โหมดแก้ไข */
  editing?: LandDetail;
  /** signed URL ของรูปเดิม (โหมดแก้ไข) */
  photoUrls?: Map<string, string>;
}) {
  const router = useRouter();

  const [name, setName] = useState(editing?.name ?? "");
  const [province, setProvince] = useState(editing?.province ?? "");
  const [district, setDistrict] = useState(editing?.district ?? "");
  const [subdistrict, setSubdistrict] = useState(editing?.subdistrict ?? "");
  const [mapsLink, setMapsLink] = useState("");
  const [lat, setLat] = useState<number | null>(editing?.lat ?? null);
  const [lng, setLng] = useState<number | null>(editing?.lng ?? null);
  const [mapsLinkInvalid, setMapsLinkInvalid] = useState(false);
  const [areaRai, setAreaRai] = useState(String(editing?.area_rai ?? ""));
  const [areaNgan, setAreaNgan] = useState(String(editing?.area_ngan ?? ""));
  const [areaWa, setAreaWa] = useState(String(editing?.area_wa ?? ""));
  const [priceTotal, setPriceTotal] = useState(
    editing?.price_total != null ? String(editing.price_total) : ""
  );
  const [deedType, setDeedType] = useState(editing?.deed_type ?? "");
  const [sellerContact, setSellerContact] = useState(
    editing?.seller_contact ?? ""
  );
  const [status, setStatus] = useState<LandStatus>(
    editing?.status ?? "interested"
  );
  const [notes, setNotes] = useState(editing?.notes ?? "");

  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [newPhotoType, setNewPhotoType] = useState<PhotoType>("land");
  const [existingPhotos, setExistingPhotos] = useState(
    editing?.land_photos ?? []
  );

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleMapsLinkChange(value: string) {
    setMapsLink(value);
    if (!value.trim()) {
      setMapsLinkInvalid(false);
      return;
    }
    const parsed = parseGoogleMapsLink(value);
    if (parsed) {
      setLat(parsed.lat);
      setLng(parsed.lng);
      setMapsLinkInvalid(false);
    } else {
      setMapsLinkInvalid(true);
    }
  }

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const added = Array.from(files).map((file) => ({
      file,
      type: newPhotoType,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingPhotos((prev) => [...prev, ...added]);
  }

  function removePendingPhoto(index: number) {
    setPendingPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function removeExistingPhoto(photoId: string, storagePath: string) {
    try {
      await deleteLandPhoto(photoId, storagePath);
      setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast.success("ลบรูปแล้ว");
    } catch {
      toast.error("ลบรูปไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("กรุณาตั้งชื่อแปลง เช่น “แปลงลุงสมชาย อ.ปากช่อง”");
      return;
    }
    const parsedPrice = priceTotal.trim() === "" ? null : Number(priceTotal);
    if (parsedPrice != null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      setErrorMessage("กรุณาใส่ราคาเป็นตัวเลข");
      return;
    }

    const input: LandInput = {
      name: name.trim(),
      province: province.trim(),
      district: district.trim(),
      subdistrict: subdistrict.trim(),
      lat,
      lng,
      area_rai: Number(areaRai) || 0,
      area_ngan: Number(areaNgan) || 0,
      area_wa: Number(areaWa) || 0,
      price_total: parsedPrice,
      deed_type: deedType,
      seller_contact: sellerContact.trim(),
      status,
      notes: notes.trim(),
    };

    setSaving(true);
    try {
      const landId = editing ? editing.id : await insertLand(input);
      if (editing) await updateLand(editing.id, input);
      await uploadLandPhotos(
        landId,
        pendingPhotos.map(({ file, type }) => ({ file, type }))
      );
      toast.success(editing ? "บันทึกการแก้ไขแล้ว" : "เพิ่มแปลงที่ดินแล้ว");
      router.push(`/land/${landId}`);
      router.refresh();
    } catch {
      setErrorMessage("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setSaving(false);
    }
  }

  const photoTypeLabel = (type: PhotoType) =>
    PHOTO_TYPES.find((t) => t.value === type)?.label ?? type;

  return (
    // desktop: ข้อมูลแปลง | เนื้อที่และราคา คู่กัน, รูปภาพ+ปุ่มเต็มแถว (มือถือเรียงตามเดิม)
    <form
      onSubmit={handleSubmit}
      className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ข้อมูลแปลง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="land-name" className="text-base">
              ชื่อเรียกแปลง *
            </Label>
            <Input
              id="land-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น แปลงลุงสมชาย อ.ปากช่อง"
              className="h-12 text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="province" className="text-base">
                จังหวัด
              </Label>
              <Input
                id="province"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district" className="text-base">
                อำเภอ
              </Label>
              <Input
                id="district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="h-12 text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subdistrict" className="text-base">
              ตำบล
            </Label>
            <Input
              id="subdistrict"
              value={subdistrict}
              onChange={(e) => setSubdistrict(e.target.value)}
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maps-link" className="text-base">
              ตำแหน่งจาก Google Maps
            </Label>
            <Input
              id="maps-link"
              value={mapsLink}
              onChange={(e) => handleMapsLinkChange(e.target.value)}
              placeholder="วางลิงก์แผนที่ หรือพิกัด เช่น 14.97, 102.08"
              className="h-12 text-base"
            />
            {lat != null && lng != null && !mapsLinkInvalid && (
              <p className="flex items-center gap-1 text-sm text-primary">
                <CheckCircle2 className="size-4" aria-hidden />
                พิกัด: {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
            )}
            {mapsLinkInvalid && (
              <p className="text-sm text-destructive">
                อ่านพิกัดจากลิงก์นี้ไม่ได้ — ลองคัดลอกลิงก์จากปุ่ม “แชร์”
                ในแอป Google Maps
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">เนื้อที่และราคา</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="area-rai" className="text-base">
                ไร่
              </Label>
              <Input
                id="area-rai"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={areaRai}
                onChange={(e) => setAreaRai(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area-ngan" className="text-base">
                งาน
              </Label>
              <Input
                id="area-ngan"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={areaNgan}
                onChange={(e) => setAreaNgan(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area-wa" className="text-base">
                ตร.วา
              </Label>
              <Input
                id="area-wa"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={areaWa}
                onChange={(e) => setAreaWa(e.target.value)}
                className="h-12 text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price-total" className="text-base">
              ราคารวม (บาท)
            </Label>
            <Input
              id="price-total"
              type="number"
              inputMode="numeric"
              min="0"
              value={priceTotal}
              onChange={(e) => setPriceTotal(e.target.value)}
              className="h-12 text-base"
            />
            <p className="text-sm text-muted-foreground">
              ราคาต่อไร่คำนวณให้อัตโนมัติจากเนื้อที่
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-base">เอกสารสิทธิ์</Label>
            <Select value={deedType} onValueChange={setDeedType}>
              <SelectTrigger className="h-12 w-full text-base">
                <SelectValue placeholder="เลือกประเภทเอกสาร" />
              </SelectTrigger>
              <SelectContent>
                {DEED_TYPES.map((deed) => (
                  <SelectItem
                    key={deed}
                    value={deed}
                    className="min-h-12 text-base"
                  >
                    {deed}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seller-contact" className="text-base">
              ติดต่อผู้ขาย
            </Label>
            <Input
              id="seller-contact"
              value={sellerContact}
              onChange={(e) => setSellerContact(e.target.value)}
              placeholder="ชื่อ เบอร์โทร"
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base">สถานะ</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as LandStatus)}
            >
              <SelectTrigger className="h-12 w-full text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAND_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="min-h-12 text-base">
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base">
              โน้ต / จุดเด่นจุดอ่อน
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="text-base"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">รูปภาพ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select
              value={newPhotoType}
              onValueChange={(v) => setNewPhotoType(v as PhotoType)}
            >
              <SelectTrigger className="h-12 flex-1 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PHOTO_TYPES.map((type) => (
                  <SelectItem
                    key={type.value}
                    value={type.value}
                    className="min-h-12 text-base"
                  >
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild variant="outline">
              <label className="cursor-pointer">
                <ImagePlus aria-hidden />
                เพิ่มรูป
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    addPhotos(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            เลือกประเภทก่อนแล้วกด “เพิ่มรูป” — รูปถูกย่อขนาดอัตโนมัติก่อนอัปโหลด
          </p>

          {(existingPhotos.length > 0 || pendingPhotos.length > 0) && (
            <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
              {existingPhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-square">
                  {photoUrls?.get(photo.storage_path) ? (
                    <Image
                      src={photoUrls.get(photo.storage_path)!}
                      alt={photoTypeLabel(photo.photo_type)}
                      fill
                      sizes="150px"
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="size-full rounded-lg bg-muted" />
                  )}
                  <Badge className="absolute bottom-1 left-1 text-xs">
                    {photoTypeLabel(photo.photo_type)}
                  </Badge>
                  <button
                    type="button"
                    aria-label="ลบรูปนี้"
                    onClick={() =>
                      removeExistingPhoto(photo.id, photo.storage_path)
                    }
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1.5 text-white"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              ))}
              {pendingPhotos.map((photo, index) => (
                <div key={photo.previewUrl} className="relative aspect-square">
                  {/* รูปรออัปโหลดเป็น object URL ชั่วคราว ใช้ next/image ไม่ได้ */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.previewUrl}
                    alt={photoTypeLabel(photo.type)}
                    className="size-full rounded-lg object-cover"
                  />
                  <Badge className="absolute bottom-1 left-1 text-xs">
                    {photoTypeLabel(photo.type)}
                  </Badge>
                  <button
                    type="button"
                    aria-label="เอารูปนี้ออก"
                    onClick={() => removePendingPhoto(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1.5 text-white"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {errorMessage && (
        <p role="alert" className="text-base text-destructive lg:col-span-2">
          {errorMessage}
        </p>
      )}

      <Button
        type="submit"
        className="w-full lg:col-span-2"
        disabled={saving}
      >
        {saving
          ? "กำลังบันทึก..."
          : editing
            ? "บันทึกการแก้ไข"
            : "บันทึกแปลงที่ดิน"}
      </Button>
    </form>
  );
}

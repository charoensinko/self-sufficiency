"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBaht } from "@/lib/format";
import { mapEmbedUrl, mapLinkUrl } from "../maps";
import { formatArea, PHOTO_TYPES, type LandDetail } from "../types";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function LandInfoTab({
  land,
  photoUrls,
}: {
  land: LandDetail;
  photoUrls: Map<string, string>;
}) {
  const location = [land.subdistrict, land.district, land.province]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">รายละเอียด</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <InfoRow label="ที่ตั้ง" value={location || "ไม่ระบุ"} />
          <InfoRow label="เนื้อที่" value={formatArea(land)} />
          <InfoRow
            label="ราคารวม"
            value={
              land.price_total != null
                ? formatBaht(land.price_total)
                : "ไม่ระบุ"
            }
          />
          <InfoRow
            label="ราคาต่อไร่"
            value={
              land.price_per_rai != null
                ? formatBaht(Math.round(land.price_per_rai))
                : "ไม่ระบุ"
            }
          />
          <InfoRow label="เอกสารสิทธิ์" value={land.deed_type || "ไม่ระบุ"} />
          <InfoRow
            label="ติดต่อผู้ขาย"
            value={land.seller_contact || "ไม่ระบุ"}
          />
        </CardContent>
      </Card>

      {land.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">โน้ต</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{land.notes}</p>
          </CardContent>
        </Card>
      )}

      {land.lat != null && land.lng != null && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              แผนที่
              <a
                href={mapLinkUrl(land.lat, land.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-normal text-primary"
              >
                เปิดใน Google Maps
                <ExternalLink className="size-4" aria-hidden />
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <iframe
              src={mapEmbedUrl(land.lat, land.lng)}
              title={`แผนที่ ${land.name}`}
              className="h-64 w-full rounded-lg border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </CardContent>
        </Card>
      )}

      {land.land_photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              รูปภาพ ({land.land_photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {land.land_photos.map((photo) => {
                const url = photoUrls.get(photo.storage_path);
                const label =
                  PHOTO_TYPES.find((t) => t.value === photo.photo_type)
                    ?.label ?? photo.photo_type;
                if (!url) return null;
                return (
                  <a
                    key={photo.id}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block aspect-square"
                  >
                    <Image
                      src={url}
                      alt={label}
                      fill
                      sizes="150px"
                      className="rounded-lg object-cover"
                    />
                    <Badge className="absolute bottom-1 left-1 text-xs">
                      {label}
                    </Badge>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

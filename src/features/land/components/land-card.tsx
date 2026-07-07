"use client";

import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBaht, formatBahtShort } from "@/lib/format";
import {
  formatArea,
  scoreBadgeClass,
  STATUS_LABELS,
  type LandWithScore,
} from "../types";

export function LandCard({ land }: { land: LandWithScore }) {
  return (
    <Link href={`/land/${land.id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-center gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold">{land.name}</span>
              <Badge variant="secondary" className="shrink-0">
                {STATUS_LABELS[land.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">
                {land.province || "ไม่ระบุจังหวัด"} · {formatArea(land)}
              </span>
            </div>
            <div className="text-sm">
              {land.price_total != null ? (
                <>
                  <span className="font-medium">
                    {formatBaht(land.price_total)}
                  </span>
                  {land.price_per_rai != null && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({formatBahtShort(Math.round(land.price_per_rai))}/ไร่)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">ยังไม่ระบุราคา</span>
              )}
            </div>
          </div>
          {land.total_score != null ? (
            <div
              className={cn(
                "flex size-14 shrink-0 flex-col items-center justify-center rounded-full",
                scoreBadgeClass(land.total_score)
              )}
            >
              <span className="text-lg font-bold leading-none">
                {Math.round(land.total_score)}
              </span>
              <span className="text-[10px] leading-tight opacity-90">
                คะแนน
              </span>
            </div>
          ) : (
            <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-full bg-muted text-muted-foreground">
              <span className="text-xs leading-tight">ยังไม่ให้</span>
              <span className="text-xs leading-tight">คะแนน</span>
            </div>
          )}
          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </CardContent>
      </Card>
    </Link>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { GROUP_CONFIG, sqmToRai } from "../types";
import type { LayoutStats } from "../types";

/** สรุปสัดส่วนพื้นที่เทียบเป้า 30:30:30:10 + สมดุลดินขุด-ดินถม */
export function LayoutStatsCard({ stats }: { stats: LayoutStats }) {
  const earthDiff = stats.pondVolume - stats.khokFillVolume;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          สัดส่วนพื้นที่ (เป้า 30:30:30:10)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          แปลงรวม {formatNumber(Math.round(stats.plotArea))} ตร.ม. (
          {sqmToRai(stats.plotArea).toFixed(1)} ไร่) · ใช้ไปแล้ว{" "}
          {Math.round(stats.usedPercent)}%
          {stats.usedPercent > 100 && " — เกิน 100% แสดงว่ามีโซนซ้อนทับกัน"}
        </p>

        <div className="space-y-3">
          {stats.groups.map(({ group, area, percent, targetPercent }) => {
            const config = GROUP_CONFIG[group];
            const diff = percent - targetPercent;
            return (
              <div key={group} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span
                      aria-hidden
                      className="inline-block size-3 rounded-sm"
                      style={{ backgroundColor: config.color }}
                    />
                    {config.label}
                  </span>
                  <span>
                    <span className="font-semibold">{percent.toFixed(0)}%</span>
                    <span className="text-muted-foreground">
                      {" "}
                      / เป้า {targetPercent}%
                    </span>
                  </span>
                </div>
                {/* แถบเทียบ: แถบสี = ทำได้จริง, ขีดดำ = เป้า */}
                <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, percent)}%`,
                      backgroundColor: config.color,
                    }}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-y-0 w-0.5 bg-foreground/70"
                    style={{ left: `${Math.min(100, targetPercent)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(Math.round(area))} ตร.ม. (
                  {sqmToRai(area).toFixed(2)} ไร่)
                  {Math.abs(diff) >= 3 &&
                    (diff > 0 ? ` · เกินเป้า ${diff.toFixed(0)}%` : ` · ขาดอีก ${(-diff).toFixed(0)}%`)}
                </p>
              </div>
            );
          })}
        </div>

        {(stats.pondVolume > 0 || stats.khokFillVolume > 0) && (
          <div className="space-y-1 rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">สมดุลดินขุด-ดินถม</p>
            <p>
              ดินขุดจากสระ ~{formatNumber(Math.round(stats.pondVolume))} ลบ.ม.
            </p>
            <p>
              ดินถมโคก ~{formatNumber(Math.round(stats.khokFillVolume))} ลบ.ม.
            </p>
            <p
              className={cn(
                "font-medium",
                earthDiff >= 0 ? "text-primary" : "text-destructive"
              )}
            >
              {earthDiff >= 0
                ? `ดินเหลือ ~${formatNumber(Math.round(earthDiff))} ลบ.ม. (พอถมโคก อาจเหลือทำถนน/คันดิน)`
                : `ดินขาด ~${formatNumber(Math.round(-earthDiff))} ลบ.ม. (ต้องซื้อดินเพิ่มหรือลดความสูงโคก)`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

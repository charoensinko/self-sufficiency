"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GitCompareArrows, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchLands } from "../queries";
import {
  LAND_STATUSES,
  STATUS_LABELS,
  type LandWithScore,
} from "../types";
import { LandCard } from "./land-card";

const ALL = "all";

export function LandListScreen() {
  const [lands, setLands] = useState<LandWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [provinceFilter, setProvinceFilter] = useState(ALL);

  useEffect(() => {
    fetchLands()
      .then(setLands)
      .catch(() =>
        setError("โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่")
      )
      .finally(() => setLoading(false));
  }, []);

  const provinces = useMemo(
    () =>
      [...new Set(lands.map((l) => l.province).filter(Boolean))] as string[],
    [lands]
  );

  const visibleLands = useMemo(() => {
    return lands
      .filter(
        (land) =>
          (statusFilter === ALL || land.status === statusFilter) &&
          (provinceFilter === ALL || land.province === provinceFilter)
      )
      .sort((a, b) => (b.total_score ?? -1) - (a.total_score ?? -1));
  }, [lands, statusFilter, provinceFilter]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
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

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button asChild className="flex-1">
          <Link href="/land/new">
            <Plus aria-hidden />
            เพิ่มแปลงที่ดิน
          </Link>
        </Button>
        {lands.length >= 2 && (
          <Button asChild variant="outline">
            <Link href="/land/compare">
              <GitCompareArrows aria-hidden />
              เปรียบเทียบ
            </Link>
          </Button>
        )}
      </div>

      {lands.length > 0 && (
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 flex-1 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="min-h-11 text-base">
                ทุกสถานะ
              </SelectItem>
              {LAND_STATUSES.map((status) => (
                <SelectItem
                  key={status}
                  value={status}
                  className="min-h-11 text-base"
                >
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {provinces.length > 1 && (
            <Select value={provinceFilter} onValueChange={setProvinceFilter}>
              <SelectTrigger className="h-11 flex-1 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} className="min-h-11 text-base">
                  ทุกจังหวัด
                </SelectItem>
                {provinces.map((province) => (
                  <SelectItem
                    key={province}
                    value={province}
                    className="min-h-11 text-base"
                  >
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {visibleLands.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          {lands.length === 0
            ? "ยังไม่มีแปลงที่ดินในระบบ — กดปุ่ม “เพิ่มแปลงที่ดิน” เพื่อเริ่มต้น"
            : "ไม่มีแปลงที่ตรงกับตัวกรอง"}
        </p>
      ) : (
        <div className="space-y-3">
          {visibleLands.map((land) => (
            <LandCard key={land.id} land={land} />
          ))}
        </div>
      )}
    </div>
  );
}

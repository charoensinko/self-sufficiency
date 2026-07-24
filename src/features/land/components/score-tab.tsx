"use client";

import { useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { upsertScore } from "../queries";
import {
  computeTotalScore,
  CRITERIA,
  scoreBadgeClass,
  type LandScore,
  type ScoreValues,
} from "../types";

const DEFAULT_VALUES: ScoreValues = {
  water_source: 3,
  soil_quality: 3,
  flood_risk: 3,
  road_access: 3,
  electricity: 3,
  hospital_distance: 3,
  community: 3,
  price_value: 3,
};

export function ScoreTab({
  landId,
  score,
  onSaved,
}: {
  landId: string;
  score: LandScore | null;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<ScoreValues>(() => {
    if (!score) return DEFAULT_VALUES;
    return Object.fromEntries(
      CRITERIA.map((c) => [c.key, score[c.key]])
    ) as ScoreValues;
  });
  const [saving, setSaving] = useState(false);

  const total = useMemo(() => computeTotalScore(values), [values]);

  const radarData = useMemo(
    () =>
      CRITERIA.map((criterion) => ({
        criterion: criterion.shortLabel,
        value: values[criterion.key],
      })),
    [values]
  );

  async function handleSave() {
    setSaving(true);
    try {
      await upsertScore(landId, values);
      toast.success("บันทึกคะแนนแล้ว");
      onSaved();
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            คะแนนรวม
            <span
              className={cn(
                "rounded-full px-4 py-1 text-xl font-bold",
                scoreBadgeClass(total)
              )}
            >
              {total}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="criterion"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 13 }}
                />
                {/* ล็อกสเกล 0-5 ทุกแกน ไม่ให้ auto-scale ตามค่าสูงสุด */}
                <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                <Radar
                  dataKey="value"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.35}
                  isAnimationActive={false}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            คะแนนถ่วงน้ำหนัก: น้ำ 20% · ดิน 15% · ปลอดภัย 15% · ที่เหลือด้านละ 10%
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
      {CRITERIA.map((criterion) => {
        const current = values[criterion.key];
        return (
          <Card key={criterion.key}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-baseline justify-between text-base">
                {criterion.label}
                <span className="text-sm font-normal text-muted-foreground">
                  น้ำหนัก {criterion.weight}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={current === level ? "default" : "outline"}
                    className="text-lg font-semibold"
                    aria-pressed={current === level}
                    onClick={() =>
                      setValues((prev) => ({
                        ...prev,
                        [criterion.key]: level,
                      }))
                    }
                  >
                    {level}
                  </Button>
                ))}
              </div>
              <p className="min-h-10 text-sm text-muted-foreground">
                {criterion.levels[current - 1]}
              </p>
            </CardContent>
          </Card>
        );
      })}
      </div>

      <Button onClick={handleSave} className="w-full" disabled={saving}>
        {saving ? "กำลังบันทึก..." : "บันทึกคะแนน"}
      </Button>
    </div>
  );
}

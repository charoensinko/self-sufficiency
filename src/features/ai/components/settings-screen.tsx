"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoutButton } from "@/components/logout-button";
import { AI_MODEL_KEY } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { fetchMonthlyUsage } from "../queries";
import { AUTO_MODEL, MODEL_OPTIONS, type MonthlyUsage } from "../types";

export function SettingsScreen() {
  const [model, setModel] = useState(AUTO_MODEL);
  const [usage, setUsage] = useState<MonthlyUsage | null>(null);
  const [usageError, setUsageError] = useState(false);

  useEffect(() => {
    setModel(localStorage.getItem(AI_MODEL_KEY) ?? AUTO_MODEL);
    fetchMonthlyUsage()
      .then(setUsage)
      .catch(() => setUsageError(true));
  }, []);

  function handleModelChange(value: string) {
    setModel(value);
    localStorage.setItem(AI_MODEL_KEY, value);
  }

  const selectedOption = MODEL_OPTIONS.find((o) => o.value === model);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon-sm" aria-label="กลับ">
          <Link href="/ai">
            <ArrowLeft aria-hidden />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">ตั้งค่า</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">โมเดล AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label className="text-base">เลือกโมเดลที่ใช้ตอบ</Label>
          <Select value={model} onValueChange={handleModelChange}>
            <SelectTrigger className="h-12 w-full text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="min-h-12 text-base"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedOption && (
            <p className="text-sm text-muted-foreground">
              {selectedOption.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            โหมด “อัตโนมัติ”: คุยทั่วไปใช้ Haiku (ถูกสุด) ·
            วิเคราะห์ลึก/เปรียบเทียบใช้ Sonnet · แนบรูปใช้ Gemini
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">การใช้งาน AI เดือนนี้</CardTitle>
        </CardHeader>
        <CardContent>
          {usageError ? (
            <p className="text-destructive">โหลดข้อมูลไม่สำเร็จ</p>
          ) : !usage ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted p-3">
                <div className="text-sm text-muted-foreground">ค่าใช้จ่าย</div>
                <div className="text-lg font-bold">
                  ${usage.totalCostUsd.toFixed(3)}
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="text-sm text-muted-foreground">ครั้ง</div>
                <div className="text-lg font-bold">
                  {formatNumber(usage.calls)}
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="text-sm text-muted-foreground">โทเคน</div>
                <div className="text-lg font-bold">
                  {formatNumber(usage.promptTokens + usage.completionTokens)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">บัญชี</CardTitle>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}

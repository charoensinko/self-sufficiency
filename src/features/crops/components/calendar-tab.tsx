"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sprout, Wheat, Hammer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProjectTask } from "@/features/project/types";
import { THAI_MONTHS } from "../types";
import type { Crop, PlantingWithCrop } from "../types";

type CalendarEvent = {
  key: string;
  date: string;
  day: number;
  kind: "plant" | "harvest" | "task";
  label: string;
  detail: string | null;
  href: string;
};

function inMonth(date: string | null, year: number, month: number): boolean {
  if (!date) return false;
  const d = new Date(date);
  return d.getFullYear() === year && d.getMonth() === month;
}

const KIND_STYLE: Record<CalendarEvent["kind"], { label: string; icon: typeof Sprout; className: string }> = {
  plant: {
    label: "ปลูก",
    icon: Sprout,
    className: "bg-primary/10 text-primary",
  },
  harvest: {
    label: "เก็บเกี่ยว",
    icon: Wheat,
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  task: {
    label: "งานโครงการ",
    icon: Hammer,
    className: "bg-secondary text-secondary-foreground",
  },
};

export function CalendarTab({
  crops,
  plantings,
  projectTasks,
}: {
  crops: Crop[];
  plantings: PlantingWithCrop[];
  projectTasks: ProjectTask[];
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  // รวมเหตุการณ์ 3 ชนิดของเดือนที่เลือก: ปลูก / คาดเก็บเกี่ยว / งานโครงการมีกำหนด
  const dayGroups = useMemo(() => {
    const events: CalendarEvent[] = [];

    for (const planting of plantings) {
      if (planting.status === "cancelled") continue;
      const cropName = planting.crops?.name ?? "พืช";
      const plantDate = planting.planted_date ?? planting.planned_date;
      if (inMonth(plantDate, year, month)) {
        events.push({
          key: `plant-${planting.id}`,
          date: plantDate as string,
          day: new Date(plantDate as string).getDate(),
          kind: "plant",
          label: cropName,
          detail: planting.zone,
          href: "?", // อยู่หน้าเดียวกัน — ไปแท็บแผนปลูก
        });
      }
      if (
        planting.status !== "harvested" &&
        inMonth(planting.expected_harvest_date, year, month)
      ) {
        events.push({
          key: `harvest-${planting.id}`,
          date: planting.expected_harvest_date as string,
          day: new Date(planting.expected_harvest_date as string).getDate(),
          kind: "harvest",
          label: cropName,
          detail: planting.zone,
          href: "?",
        });
      }
    }

    for (const task of projectTasks) {
      if (task.done || !inMonth(task.due_date, year, month)) continue;
      events.push({
        key: `task-${task.id}`,
        date: task.due_date as string,
        day: new Date(task.due_date as string).getDate(),
        kind: "task",
        label: task.title,
        detail: null,
        href: `/project/${task.phase_id}`,
      });
    }

    const byDay = new Map<number, CalendarEvent[]>();
    for (const event of events) {
      const list = byDay.get(event.day) ?? [];
      list.push(event);
      byDay.set(event.day, list);
    }
    return [...byDay.entries()].sort(([a], [b]) => a - b);
  }, [plantings, projectTasks, year, month]);

  // พืชที่เหมาะปลูกเดือนนี้ตามฐานข้อมูล (เดือน 1-12)
  const monthCrops = useMemo(() => {
    const specific = crops.filter((c) =>
      c.planting_months.includes(month + 1)
    );
    const allYearCount = crops.filter(
      (c) => c.planting_months.length === 0
    ).length;
    return { specific, allYearCount };
  }, [crops, month]);

  const yearBE = year + 543;

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0">
      <div className="space-y-4">
        {/* เลือกเดือน */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            aria-label="เดือนก่อนหน้า"
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <h2 className="text-lg font-semibold">
            {THAI_MONTHS[month]} {yearBE}
          </h2>
          <Button
            variant="outline"
            size="icon"
            aria-label="เดือนถัดไป"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>

        {/* เหตุการณ์รายวันของเดือนนี้ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">กำหนดการเดือนนี้</CardTitle>
          </CardHeader>
          <CardContent>
            {dayGroups.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">
                ไม่มีกำหนดการในเดือนนี้
              </p>
            ) : (
              <ul className="divide-y">
                {dayGroups.map(([day, dayEvents]) => (
                  <li key={day} className="flex gap-3 py-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-bold">
                      {day}
                    </span>
                    <ul className="min-w-0 flex-1 space-y-1.5">
                      {dayEvents.map((event) => {
                        const style = KIND_STYLE[event.kind];
                        const Icon = style.icon;
                        const content = (
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                style.className
                              )}
                            >
                              <Icon className="size-3.5" aria-hidden />
                              {style.label}
                            </span>
                            <span className="min-w-0 flex-1 truncate">
                              {event.label}
                              {event.detail && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  ({event.detail})
                                </span>
                              )}
                            </span>
                          </span>
                        );
                        return (
                          <li key={event.key}>
                            {event.kind === "task" ? (
                              <Link
                                href={event.href}
                                className="block rounded-md p-1 -mx-1 hover:bg-muted"
                              >
                                {content}
                              </Link>
                            ) : (
                              content
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* พืชแนะนำประจำเดือน */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sprout className="size-5 text-primary" aria-hidden />
            พืชที่เหมาะปลูกเดือน{THAI_MONTHS[month]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {monthCrops.specific.length === 0 ? (
            <p className="text-muted-foreground">
              ไม่มีพืชที่เจาะจงเดือนนี้เป็นพิเศษ
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {monthCrops.specific.map((crop) => (
                <Badge key={crop.id} variant="secondary" className="text-sm">
                  {crop.name}
                </Badge>
              ))}
            </div>
          )}
          {monthCrops.allYearCount > 0 && (
            <p className="text-sm text-muted-foreground">
              และอีก {monthCrops.allYearCount} ชนิดปลูกได้ทั้งปี —
              ดูในแท็บฐานข้อมูลพืช
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

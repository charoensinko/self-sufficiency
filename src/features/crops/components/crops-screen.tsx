"use client";

import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchAllTasks } from "@/features/project/queries";
import type { ProjectTask } from "@/features/project/types";
import { fetchCrops, fetchPlantings } from "../queries";
import type { Crop, PlantingWithCrop } from "../types";
import { CalendarTab } from "./calendar-tab";
import { CropDbTab } from "./crop-db-tab";
import { PlantingsTab } from "./plantings-tab";

export function CropsScreen() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [plantings, setPlantings] = useState<PlantingWithCrop[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const [allCrops, allPlantings, allTasks] = await Promise.all([
        fetchCrops(),
        fetchPlantings(),
        fetchAllTasks(),
      ]);
      setCrops(allCrops);
      setPlantings(allPlantings);
      setProjectTasks(allTasks);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
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
    <Tabs defaultValue="calendar">
      <TabsList className="grid h-12 w-full grid-cols-3">
        <TabsTrigger value="calendar" className="text-base">
          ปฏิทิน
        </TabsTrigger>
        <TabsTrigger value="plantings" className="text-base">
          แผนปลูก
        </TabsTrigger>
        <TabsTrigger value="crops" className="text-base">
          ฐานข้อมูลพืช
        </TabsTrigger>
      </TabsList>

      <TabsContent value="calendar" className="mt-4">
        <CalendarTab
          crops={crops}
          plantings={plantings}
          projectTasks={projectTasks}
        />
      </TabsContent>

      <TabsContent value="plantings" className="mt-4">
        <PlantingsTab crops={crops} plantings={plantings} onChanged={reload} />
      </TabsContent>

      <TabsContent value="crops" className="mt-4">
        <CropDbTab crops={crops} onChanged={reload} />
      </TabsContent>
    </Tabs>
  );
}

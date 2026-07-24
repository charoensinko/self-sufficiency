import type { Metadata } from "next";
import { ProjectScreen } from "@/features/project/components/project-screen";

export const metadata: Metadata = {
  title: "โครงการ",
};

export default function ProjectPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6 lg:max-w-5xl lg:px-8">
      <h1 className="mb-1 text-2xl font-bold">โครงการ</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        แผนแม่บท 10 เฟส ตั้งแต่ได้ที่ดินจนอยู่ได้จริง
      </p>
      <ProjectScreen />
    </main>
  );
}

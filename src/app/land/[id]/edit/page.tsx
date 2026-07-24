import type { Metadata } from "next";
import { LandEditScreen } from "@/features/land/components/land-edit-screen";

export const metadata: Metadata = {
  title: "แก้ไขแปลงที่ดิน",
};

export default async function EditLandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-lg px-4 py-6 lg:max-w-5xl lg:px-8">
      <LandEditScreen landId={id} />
    </main>
  );
}

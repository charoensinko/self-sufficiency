import type { Metadata } from "next";
import { LandDetailScreen } from "@/features/land/components/land-detail-screen";

export const metadata: Metadata = {
  title: "รายละเอียดแปลง",
};

export default async function LandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-lg px-4 py-6 lg:max-w-3xl lg:px-8">
      <LandDetailScreen landId={id} />
    </main>
  );
}

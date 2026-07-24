import type { Metadata } from "next";
import { PhaseDetailScreen } from "@/features/project/components/phase-detail-screen";

export const metadata: Metadata = {
  title: "รายละเอียดเฟส",
};

export default async function PhaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-lg px-4 py-6 lg:max-w-5xl lg:px-8">
      <PhaseDetailScreen phaseId={id} />
    </main>
  );
}

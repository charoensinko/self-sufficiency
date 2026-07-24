import type { Metadata } from "next";
import { JournalScreen } from "@/features/journal/components/journal-screen";

export const metadata: Metadata = {
  title: "บันทึกประจำวัน",
};

export default function JournalPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6 lg:max-w-5xl lg:px-8">
      <h1 className="mb-1 text-2xl font-bold">บันทึกประจำวัน</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        เรื่องราวและรูปความก้าวหน้าของสวนเรา
      </p>
      <JournalScreen />
    </main>
  );
}

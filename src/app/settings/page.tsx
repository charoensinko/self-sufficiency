import type { Metadata } from "next";
import { SettingsScreen } from "@/features/ai/components/settings-screen";

export const metadata: Metadata = {
  title: "ตั้งค่า",
};

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <SettingsScreen />
    </main>
  );
}

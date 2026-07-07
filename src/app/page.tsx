import { LogoutButton } from "@/components/logout-button";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">เกษียณสุข</h1>
        <LogoutButton />
      </div>
      <p className="mt-1 text-muted-foreground">
        สู่วิถีเกษตรพอเพียง — แดชบอร์ดจะแสดงที่นี่
      </p>
    </main>
  );
}

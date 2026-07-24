import { LogoutButton } from "@/components/logout-button";
import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6 lg:max-w-5xl lg:px-8">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">เกษียณสุข</h1>
          <p className="text-sm text-muted-foreground">สู่วิถีเกษตรพอเพียง</p>
        </div>
        {/* จอใหญ่มีปุ่มออกจากระบบใน Sidebar อยู่แล้ว */}
        <div className="lg:hidden">
          <LogoutButton />
        </div>
      </div>
      <DashboardScreen />
    </main>
  );
}

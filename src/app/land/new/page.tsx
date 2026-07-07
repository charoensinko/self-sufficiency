import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandForm } from "@/features/land/components/land-form";

export const metadata: Metadata = {
  title: "เพิ่มแปลงที่ดิน",
};

export default function NewLandPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Button asChild variant="ghost" size="icon-sm" aria-label="กลับ">
          <Link href="/land">
            <ArrowLeft aria-hidden />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">เพิ่มแปลงที่ดิน</h1>
      </div>
      <LandForm />
    </main>
  );
}

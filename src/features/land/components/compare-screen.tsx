"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AI_PREFILL_KEY } from "@/lib/constants";
import { formatBaht, formatNumber } from "@/lib/format";
import {
  fetchChecklistProgress,
  fetchLands,
  fetchScores,
} from "../queries";
import {
  CRITERIA,
  formatArea,
  scoreBadgeClass,
  STATUS_LABELS,
  totalAreaRai,
  type LandScore,
  type LandWithScore,
} from "../types";

const MAX_COMPARE = 4;

export function CompareScreen() {
  const router = useRouter();
  const [lands, setLands] = useState<LandWithScore[]>([]);
  const [scores, setScores] = useState<Map<string, LandScore>>(new Map());
  const [progress, setProgress] = useState<
    Map<string, { done: number; total: number }>
  >(new Map());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const allLands = await fetchLands();
        const ids = allLands.map((l) => l.id);
        const [scoreMap, progressMap] = await Promise.all([
          fetchScores(ids),
          fetchChecklistProgress(ids),
        ]);
        setLands(allLands);
        setScores(scoreMap);
        setProgress(progressMap);
        // เริ่มต้นเลือกแปลงคะแนนสูงสุดให้ก่อน (ไม่เกิน 3)
        setSelected(
          new Set(
            [...allLands]
              .sort((a, b) => (b.total_score ?? -1) - (a.total_score ?? -1))
              .slice(0, 3)
              .map((l) => l.id)
          )
        );
      } catch {
        setError("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const selectedLands = useMemo(
    () => lands.filter((land) => selected.has(land.id)),
    [lands, selected]
  );

  function toggle(landId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(landId)) {
        next.delete(landId);
      } else if (next.size >= MAX_COMPARE) {
        toast.info(`เปรียบเทียบได้สูงสุด ${MAX_COMPARE} แปลง`);
        return prev;
      } else {
        next.add(landId);
      }
      return next;
    });
  }

  function buildAiPrompt(): string {
    const sections = selectedLands.map((land) => {
      const score = scores.get(land.id);
      const prog = progress.get(land.id);
      const lines = [
        `## ${land.name}`,
        `- ที่ตั้ง: ${[land.subdistrict, land.district, land.province].filter(Boolean).join(" ") || "ไม่ระบุ"}`,
        `- เนื้อที่: ${formatArea(land)} (${totalAreaRai(land).toFixed(2)} ไร่)`,
        `- ราคา: ${land.price_total != null ? formatBaht(land.price_total) : "ไม่ระบุ"}` +
          (land.price_per_rai != null
            ? ` (${formatBaht(Math.round(land.price_per_rai))}/ไร่)`
            : ""),
        `- เอกสารสิทธิ์: ${land.deed_type ?? "ไม่ระบุ"}`,
        `- สถานะ: ${STATUS_LABELS[land.status]}`,
      ];
      if (score) {
        lines.push(`- คะแนนรวม: ${score.total_score}/100`);
        lines.push(
          `- คะแนนรายเกณฑ์: ${CRITERIA.map(
            (c) => `${c.label} ${score[c.key]}/5`
          ).join(", ")}`
        );
      } else {
        lines.push("- ยังไม่ได้ให้คะแนน");
      }
      if (prog) {
        lines.push(`- ตรวจ checklist แล้ว: ${prog.done}/${prog.total} ข้อ`);
      }
      if (land.notes) lines.push(`- โน้ต: ${land.notes}`);
      return lines.join("\n");
    });

    return [
      `ช่วยวิเคราะห์เปรียบเทียบแปลงที่ดิน ${selectedLands.length} แปลงนี้อย่างละเอียด`,
      "จุดแข็ง จุดอ่อน ความเสี่ยงของแต่ละแปลง และแนะนำว่าควรเลือกแปลงไหนเพราะอะไร",
      "โดยพิจารณาจากเป้าหมาย: ทำเกษตรทฤษฎีใหม่/โคก หนอง นา อยู่เองวัยเกษียณ 2 คน",
      "",
      ...sections,
    ].join("\n");
  }

  function handleSendToAi() {
    sessionStorage.setItem(
      AI_PREFILL_KEY,
      JSON.stringify({ message: buildAiPrompt(), task: "compare" })
    );
    router.push("/ai");
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
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

  const rows: {
    label: string;
    render: (land: LandWithScore) => React.ReactNode;
  }[] = [
    {
      label: "คะแนนรวม",
      render: (land) =>
        land.total_score != null ? (
          <span
            className={cn(
              "inline-block rounded-full px-2.5 py-0.5 font-bold",
              scoreBadgeClass(land.total_score)
            )}
          >
            {Math.round(land.total_score)}
          </span>
        ) : (
          "—"
        ),
    },
    ...CRITERIA.map((criterion) => ({
      label: `· ${criterion.label} (${criterion.weight}%)`,
      render: (land: LandWithScore) => {
        const score = scores.get(land.id);
        return score ? `${score[criterion.key]}/5` : "—";
      },
    })),
    {
      label: "ราคารวม",
      render: (land) =>
        land.price_total != null ? formatBaht(land.price_total) : "—",
    },
    {
      label: "ราคา/ไร่",
      render: (land) =>
        land.price_per_rai != null
          ? formatNumber(Math.round(land.price_per_rai))
          : "—",
    },
    { label: "เนื้อที่", render: (land) => formatArea(land) },
    { label: "จังหวัด", render: (land) => land.province ?? "—" },
    { label: "เอกสารสิทธิ์", render: (land) => land.deed_type ?? "—" },
    { label: "สถานะ", render: (land) => STATUS_LABELS[land.status] },
    {
      label: "เช็คลิสต์",
      render: (land) => {
        const prog = progress.get(land.id);
        return prog ? `${prog.done}/${prog.total} ข้อ` : "—";
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon-sm" aria-label="กลับ">
          <Link href="/land">
            <ArrowLeft aria-hidden />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">เปรียบเทียบแปลง</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {lands.map((land) => (
          <Button
            key={land.id}
            variant={selected.has(land.id) ? "default" : "outline"}
            size="sm"
            aria-pressed={selected.has(land.id)}
            onClick={() => toggle(land.id)}
          >
            {land.name}
          </Button>
        ))}
      </div>

      {selectedLands.length < 2 ? (
        <p className="py-10 text-center text-muted-foreground">
          เลือกอย่างน้อย 2 แปลงเพื่อเปรียบเทียบ
        </p>
      ) : (
        <>
          <Card>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="sticky left-0 bg-card py-2 pr-3 text-left font-medium text-muted-foreground">
                      หัวข้อ
                    </th>
                    {selectedLands.map((land) => (
                      <th
                        key={land.id}
                        className="max-w-32 px-3 py-2 text-left font-semibold"
                      >
                        <Link
                          href={`/land/${land.id}`}
                          className="line-clamp-2 underline-offset-2 hover:underline"
                        >
                          {land.name}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label} className="border-b last:border-0">
                      <td className="sticky left-0 bg-card py-2.5 pr-3 text-muted-foreground">
                        {row.label}
                      </td>
                      {selectedLands.map((land) => (
                        <td key={land.id} className="px-3 py-2.5">
                          {row.render(land)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Button onClick={handleSendToAi} className="w-full">
            <Sparkles aria-hidden />
            ให้ AI ช่วยวิเคราะห์ {selectedLands.length} แปลงนี้
          </Button>
        </>
      )}
    </div>
  );
}

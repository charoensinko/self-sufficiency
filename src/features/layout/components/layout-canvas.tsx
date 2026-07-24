"use client";

import { useRef, useState } from "react";
import { ZONE_CONFIG } from "../types";
import type { LayoutElement } from "../types";

/**
 * Canvas ผังแปลงเป็น SVG — viewBox หน่วยเป็นเมตรตรงกับขนาดแปลงจริง
 * ลากย้ายด้วย pointer events (รองรับทั้งนิ้วและเมาส์) ส่วนการย่อ/ขยาย
 * ใช้ช่องกรอกตัวเลขในแผงด้านข้างแทน drag handle (ใช้ง่ายกว่าบนมือถือ)
 *
 * โหมดตั้งสเกล (calibrating): ลากเส้นอ้างอิงทับรูปพื้นหลัง 1 เส้น
 * แล้วส่งความยาวที่ลาก (เมตรตาม canvas ปัจจุบัน) กลับไปให้ parent
 * ถามความยาวจริงเพื่อคำนวณสเกลรูปใหม่
 */
export function LayoutCanvas({
  widthM,
  heightM,
  elements,
  selectedId,
  bgUrl,
  bgWidthM,
  bgHeightM,
  calibrating,
  onSelect,
  onMove,
  onCalibrateDone,
}: {
  widthM: number;
  heightM: number;
  elements: LayoutElement[];
  selectedId: string | null;
  bgUrl: string | null;
  bgWidthM: number | null;
  bgHeightM: number | null;
  calibrating: boolean;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onCalibrateDone: (drawnLengthM: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [calLine, setCalLine] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const calDrawing = useRef(false);

  function toMeters(e: React.PointerEvent): { x: number; y: number } {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((e.clientX - rect.left) / rect.width) * widthM,
      y: ((e.clientY - rect.top) / rect.height) * heightM,
    };
  }

  function handlePointerDown(e: React.PointerEvent, element: LayoutElement) {
    e.stopPropagation();
    onSelect(element.id);
    const point = toMeters(e);
    dragRef.current = {
      id: element.id,
      offsetX: point.x - element.x,
      offsetY: point.y - element.y,
    };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent, element: LayoutElement) {
    const drag = dragRef.current;
    if (!drag || drag.id !== element.id) return;
    const point = toMeters(e);
    const x = Math.min(Math.max(0, point.x - drag.offsetX), widthM - element.w);
    const y = Math.min(
      Math.max(0, point.y - drag.offsetY),
      heightM - element.h
    );
    onMove(element.id, Math.round(x * 2) / 2, Math.round(y * 2) / 2);
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleCalDown(e: React.PointerEvent) {
    e.stopPropagation();
    const point = toMeters(e);
    calDrawing.current = true;
    setCalLine({ x1: point.x, y1: point.y, x2: point.x, y2: point.y });
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }

  function handleCalMove(e: React.PointerEvent) {
    if (!calDrawing.current) return;
    const point = toMeters(e);
    setCalLine((prev) =>
      prev ? { ...prev, x2: point.x, y2: point.y } : prev
    );
  }

  function handleCalUp() {
    calDrawing.current = false;
    if (calLine) {
      const length = Math.hypot(
        calLine.x2 - calLine.x1,
        calLine.y2 - calLine.y1
      );
      if (length >= 1) onCalibrateDone(length);
    }
    setCalLine(null);
  }

  const gridLines: React.ReactNode[] = [];
  for (let x = 10; x < widthM; x += 10) {
    gridLines.push(
      <line
        key={`v${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={heightM}
        stroke="currentColor"
        strokeWidth={0.15}
      />
    );
  }
  for (let y = 10; y < heightM; y += 10) {
    gridLines.push(
      <line
        key={`h${y}`}
        x1={0}
        y1={y}
        x2={widthM}
        y2={y}
        stroke="currentColor"
        strokeWidth={0.15}
      />
    );
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${widthM} ${heightM}`}
      className="w-full touch-none rounded-xl border bg-[#f5f3ee] dark:bg-muted"
      onPointerDown={() => onSelect(null)}
      role="img"
      aria-label="ผังแปลง"
    >
      {bgUrl && bgWidthM != null && bgHeightM != null && (
        <image
          href={bgUrl}
          x={0}
          y={0}
          width={bgWidthM}
          height={bgHeightM}
          opacity={0.55}
          preserveAspectRatio="none"
        />
      )}

      <g className="text-border">{gridLines}</g>

      {elements.map((element) => {
        const config = ZONE_CONFIG[element.kind];
        const selected = element.id === selectedId;
        const stroke = selected ? "#0f172a" : config.stroke;
        const strokeWidth = selected ? 1.2 : 0.5;
        const fontSize = Math.min(4, element.w / 5, element.h / 2.5);
        return (
          <g
            key={element.id}
            className="cursor-move"
            pointerEvents={calibrating ? "none" : undefined}
            onPointerDown={(e) => handlePointerDown(e, element)}
            onPointerMove={(e) => handlePointerMove(e, element)}
            onPointerUp={handlePointerUp}
          >
            {config.shape === "ellipse" ? (
              <ellipse
                cx={element.x + element.w / 2}
                cy={element.y + element.h / 2}
                rx={element.w / 2}
                ry={element.h / 2}
                fill={config.fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={selected ? "2 1" : undefined}
              />
            ) : (
              <rect
                x={element.x}
                y={element.y}
                width={element.w}
                height={element.h}
                rx={1.5}
                fill={config.fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={selected ? "2 1" : undefined}
              />
            )}
            {fontSize >= 1.8 && (
              <text
                x={element.x + element.w / 2}
                y={element.y + element.h / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={fontSize}
                fill="#1f2937"
                className="pointer-events-none select-none"
              >
                {config.label}
              </text>
            )}
          </g>
        );
      })}

      {calibrating && (
        <g>
          {/* ชั้นรับ pointer สำหรับลากเส้นอ้างอิง */}
          <rect
            x={0}
            y={0}
            width={widthM}
            height={heightM}
            fill="transparent"
            className="cursor-crosshair"
            onPointerDown={handleCalDown}
            onPointerMove={handleCalMove}
            onPointerUp={handleCalUp}
          />
          {calLine && (
            <g className="pointer-events-none">
              <line
                x1={calLine.x1}
                y1={calLine.y1}
                x2={calLine.x2}
                y2={calLine.y2}
                stroke="#dc2626"
                strokeWidth={0.8}
                strokeDasharray="2 1"
              />
              <circle cx={calLine.x1} cy={calLine.y1} r={1.2} fill="#dc2626" />
              <circle cx={calLine.x2} cy={calLine.y2} r={1.2} fill="#dc2626" />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}

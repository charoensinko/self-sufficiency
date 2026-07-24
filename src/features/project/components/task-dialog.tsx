"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectTask, TaskInput } from "../types";

/** ฟอร์มเพิ่ม/แก้ไขงาน — ถ้ามี task คือแก้ไข (ลบได้), ไม่มีคือเพิ่มใหม่ */
export function TaskDialog({
  open,
  task,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  task: ProjectTask | null;
  onOpenChange: (open: boolean) => void;
  onSave: (input: TaskInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isMilestone, setIsMilestone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setDetail(task?.detail ?? "");
      setDueDate(task?.due_date ?? "");
      setIsMilestone(task?.is_milestone ?? false);
      setConfirmDelete(false);
    }
  }, [open, task]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        detail: detail.trim() || null,
        is_milestone: isMilestone,
        due_date: dueDate || null,
      });
      onOpenChange(false);
    } catch {
      // parent แสดง toast แล้ว — คง dialog ไว้ให้ลองใหม่
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    try {
      await onDelete();
      onOpenChange(false);
    } catch {
      // parent แสดง toast แล้ว — คง dialog ไว้ให้ลองใหม่
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "แก้ไขงาน" : "เพิ่มงานใหม่"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">ชื่องาน</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ติดต่อช่างขุดสระ"
              className="h-12 text-base"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-detail">รายละเอียด (ไม่บังคับ)</Label>
            <Textarea
              id="task-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={2}
              className="text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-due">กำหนดเสร็จ (ไม่บังคับ)</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-12 text-base"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="task-milestone" className="font-normal">
              เป็นเป้าหมายสำคัญ (Milestone)
            </Label>
            <Switch
              id="task-milestone"
              checked={isMilestone}
              onCheckedChange={setIsMilestone}
            />
          </div>
          <div className="flex gap-2">
            {task && onDelete && (
              <Button
                type="button"
                variant={confirmDelete ? "destructive" : "outline"}
                onClick={handleDelete}
                disabled={saving}
              >
                {confirmDelete ? "ยืนยันลบ?" : "ลบงาน"}
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
              disabled={saving || !title.trim()}
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * บีบอัดรูปฝั่ง client ก่อนอัปโหลด (กติกา: ด้านยาวสุดไม่เกิน 1600px)
 * คืนค่าเป็น JPEG คุณภาพ 0.85 — ถ้าบีบไม่ได้ (เช่น ไฟล์ไม่ใช่รูป) คืนไฟล์เดิม
 */
export async function compressImage(
  file: File,
  maxDimension = 1600
): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height)
    );
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    return await new Promise<Blob>((resolve) =>
      canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.85)
    );
  } catch {
    return file;
  }
}

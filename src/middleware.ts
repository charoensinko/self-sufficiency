import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // ทุก route ยกเว้น static assets และไฟล์ PWA
    "/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|workbox-.*|swe-worker-.*|manifest\\..*|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

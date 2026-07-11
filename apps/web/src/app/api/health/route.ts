import { env } from "@/env";

export const runtime = "nodejs";

export function GET() {
  return Response.json({ ok: true, sha: env.GIT_SHA });
}

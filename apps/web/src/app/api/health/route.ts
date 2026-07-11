export const runtime = "nodejs";

export function GET() {
  const sha = process.env.GIT_SHA ?? "dev";
  return Response.json({ ok: true, sha });
}

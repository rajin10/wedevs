// Pure routing decision shared by middleware. Kept side-effect-free so it is
// trivially unit-testable; the middleware wrapper supplies `hasSession`.
export function authRedirect({
  pathname,
  hasSession,
}: {
  pathname: string;
  hasSession: boolean;
}): string | null {
  const isApp = pathname === "/app" || pathname.startsWith("/app/");
  if (isApp && !hasSession) return "/login";
  if (pathname === "/login" && hasSession) return "/app";
  return null;
}

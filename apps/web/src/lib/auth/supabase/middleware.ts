import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";

// Refreshes the Supabase auth cookie on each request and returns a response
// carrying the updated cookies. Called from middleware.ts ONLY when Supabase
// is configured. Follows the @supabase/ssr Next.js middleware recipe.
export async function updateSupabaseSession(
  req: NextRequest,
): Promise<{ res: NextResponse; hasSession: boolean }> {
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          toSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  const { data } = await supabase.auth.getUser();
  return { res, hasSession: Boolean(data.user) };
}

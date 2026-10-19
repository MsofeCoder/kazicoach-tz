export interface AccessEnv {
  LOCAL_ACCOUNTS_ENABLED?: string;
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
}
export async function premiumAccess(
  request: Request,
  env: AccessEnv,
  send: typeof fetch = fetch,
): Promise<{ status: number; error: string } | null> {
  let url: URL;
  try {
    url = new URL(env.SUPABASE_URL || "");
  } catch {
    return { status: 503, error: "Local account service is not configured." };
  }
  if (
    env.LOCAL_ACCOUNTS_ENABLED !== "true" ||
    !["localhost", "127.0.0.1"].includes(url.hostname) ||
    url.protocol !== "http:" ||
    !env.SUPABASE_PUBLISHABLE_KEY
  )
    return { status: 503, error: "Cloud coaching is disabled during review." };
  const authorization = request.headers.get("authorization");
  if (
    !authorization?.match(
      /^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    )
  )
    return { status: 401, error: "Sign in to use cloud coaching." };
  try {
    const result = await send(
      new URL("/rest/v1/rpc/kc_consume_cloud_request", url),
      {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_PUBLISHABLE_KEY,
          Authorization: authorization,
          "Content-Type": "application/json",
        },
        body: "{}",
        signal: AbortSignal.timeout(8000),
      },
    );
    if (result.status === 401)
      return { status: 401, error: "Sign in again to use cloud coaching." };
    const body: unknown = await result.json().catch(() => null);
    if (result.ok && body === true) return null;
    return (body as { code?: string } | null)?.code === "P0001"
      ? { status: 429, error: "Daily cloud coaching limit reached." }
      : { status: 403, error: "An active premium package is required." };
  } catch {
    return { status: 503, error: "Access could not be verified. Retry later." };
  }
}

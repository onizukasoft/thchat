const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export function getClientIp(req: Request): string {
  const fwd = (req as import("next/server").NextRequest).headers?.get("x-forwarded-for");
  return fwd?.split(",")[0].trim() ?? "unknown";
}

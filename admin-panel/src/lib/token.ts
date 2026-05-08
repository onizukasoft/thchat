// Edge-compatible HMAC-signed session tokens (no server-side state needed)
const enc = new TextEncoder();

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const buf = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function createToken(secret: string): Promise<string> {
  const id = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  const sig = await hmac(secret, id);
  return `${id}.${sig}`;
}

export async function verifyToken(secret: string, token: string): Promise<boolean> {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(secret, id);
  if (sig.length !== expected.length) return false;
  // constant-time comparison to prevent timing attacks
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

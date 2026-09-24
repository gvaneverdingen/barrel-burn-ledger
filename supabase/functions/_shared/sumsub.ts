// Minimal signed client for the Sumsub API (https://docs.sumsub.com/reference/authentication)
const BASE = "https://api.sumsub.com";

async function hmacHex(secret: string, data: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function sumsubConfigured() {
  return !!(Deno.env.get("SUMSUB_APP_TOKEN") && Deno.env.get("SUMSUB_SECRET_KEY"));
}

export async function sumsubRequest(method: "GET" | "POST", path: string, body?: unknown) {
  const token = Deno.env.get("SUMSUB_APP_TOKEN")!;
  const secret = Deno.env.get("SUMSUB_SECRET_KEY")!;
  const ts = Math.floor(Date.now() / 1000).toString();
  const payload = body ? JSON.stringify(body) : "";
  const sig = await hmacHex(secret, ts + method + path + payload);
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-App-Token": token,
      "X-App-Access-Ts": ts,
      "X-App-Access-Sig": sig,
    },
    body: payload || undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Sumsub ${res.status}: ${json?.description || JSON.stringify(json)}`);
  return json;
}

export async function hmacDigest(secret: string, raw: string, alg: string) {
  const hash = alg === "HMAC_SHA512_HEX" ? "SHA-512" : alg === "HMAC_SHA1_HEX" ? "SHA-1" : "SHA-256";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

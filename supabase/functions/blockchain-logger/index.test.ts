import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { assert } from "https://deno.land/std@0.224.0/assert/assert.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("blockchain-logger rejects unauthenticated requests", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/blockchain-logger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caskId: "test-cask-id",
      buyerId: "test-buyer-id",
      transactionType: "mint",
      volume: 100,
      price: 50000,
      timestamp: Date.now(),
    }),
  });
  const body = await response.text();
  assertEquals(response.status, 401);
});

Deno.test("blockchain-logger handles OPTIONS preflight", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/blockchain-logger`, {
    method: "OPTIONS",
  });
  await response.text();
  assertEquals(response.status, 200);
});

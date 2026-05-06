import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function makeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase 기본 Secret이 없습니다." }, 500);

  const body = await req.json().catch(() => ({}));
  const payload = body.payload || {};
  if (!payload.url || !payload.key) return json({ error: "공유 payload가 올바르지 않습니다." }, 400);

  const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  for (let i = 0; i < 5; i += 1) {
    const token = makeToken();
    const { error } = await sb.from("share_links").insert({ token, payload });
    if (!error) return json({ token });
    if (!/duplicate|unique/i.test(error.message || "")) return json({ error: error.message }, 500);
  }
  return json({ error: "공유 토큰 생성에 실패했습니다." }, 500);
});

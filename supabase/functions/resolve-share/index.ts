import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase 기본 Secret이 없습니다." }, 500);

  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(token)) return json({ error: "공유 토큰이 올바르지 않습니다." }, 400);

  const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data, error } = await sb.from("share_links").select("payload").eq("token", token).maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!data?.payload?.url || !data?.payload?.key) return json({ error: "공유 링크를 찾을 수 없습니다." }, 404);
  return json({ payload: data.payload });
});

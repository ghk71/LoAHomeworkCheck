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

function webhookDeleteUrl(webhookUrl: string, messageId: string) {
  const url = new URL(webhookUrl);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.lastIndexOf("webhooks");
  if (idx < 0 || !parts[idx + 1] || !parts[idx + 2]) {
    throw new Error("Webhook URL 형식이 올바르지 않습니다.");
  }
  return `${url.origin}/api/webhooks/${parts[idx + 1]}/${parts[idx + 2]}/messages/${encodeURIComponent(messageId)}`;
}

function webhookUrlFromEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} Secret이 없습니다.`);
  return value;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase 기본 Secret이 없습니다." }, 500);

  const body = await req.json().catch(() => ({}));
  const kind = String(body.kind || "").trim();
  const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  let query = sb
    .from("discord_sent_messages")
    .select("*")
    .is("deleted_at", null)
    .lte("delete_after", new Date().toISOString())
    .order("delete_after", { ascending: true })
    .limit(100);
  if (kind) query = query.eq("kind", kind);

  const { data, error } = await query;
  if (error) return json({ error: error.message }, 500);

  let deleted = 0;
  let failed = 0;
  for (const row of data || []) {
    try {
      const webhookUrl = webhookUrlFromEnv(row.webhook_env);
      const res = await fetch(webhookDeleteUrl(webhookUrl, row.message_id), { method: "DELETE" });
      if (res.ok || res.status === 404) {
        await sb.from("discord_sent_messages").update({
          deleted_at: new Date().toISOString(),
          delete_attempts: Number(row.delete_attempts || 0) + 1,
          last_error: null,
        }).eq("id", row.id);
        deleted += 1;
      } else {
        const text = await res.text().catch(() => "");
        await sb.from("discord_sent_messages").update({
          delete_attempts: Number(row.delete_attempts || 0) + 1,
          last_error: `Discord 삭제 실패: ${res.status} ${text}`.slice(0, 1000),
        }).eq("id", row.id);
        failed += 1;
      }
    } catch (err) {
      await sb.from("discord_sent_messages").update({
        delete_attempts: Number(row.delete_attempts || 0) + 1,
        last_error: (err instanceof Error ? err.message : String(err)).slice(0, 1000),
      }).eq("id", row.id);
      failed += 1;
    }
  }

  return json({ ok: true, kind: kind || "all", scanned: (data || []).length, deleted, failed });
});

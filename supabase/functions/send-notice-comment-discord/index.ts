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

function clean(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const webhookUrl = Deno.env.get("DISCORD_NOTICE_WEBHOOK_URL") || Deno.env.get("DISCORD_RAID_WEBHOOK_URL");
  if (!webhookUrl) {
    return json({ error: "DISCORD_NOTICE_WEBHOOK_URL 또는 DISCORD_RAID_WEBHOOK_URL Secret이 없습니다." }, 500);
  }

  const body = await req.json().catch(() => ({}));
  const author = truncate(clean(body.author, "익명") || "익명", 60);
  const content = truncate(clean(body.content), 600);
  const notice = truncate(clean(body.notice, "없음") || "없음", 500);
  const weekLabel = truncate(clean(body.weekLabel, body.weekStartDate || "이번 주"), 120);
  const shareUrl = truncate(clean(body.shareUrl), 400);

  if (!content) return json({ error: "댓글 내용이 없습니다." }, 400);

  const lines = [
    "💬 새 공지사항 댓글",
    "",
    `**주차:** ${weekLabel}`,
    `**작성자:** ${author}`,
    `**댓글:** ${content}`,
    "",
    `**공지사항:** ${notice}`,
    shareUrl ? `\n공유 링크: ${shareUrl}` : "",
  ];

  const discordRes = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: lines.filter(Boolean).join("\n"),
      allowed_mentions: { parse: [] },
    }),
  });

  if (!discordRes.ok) {
    const text = await discordRes.text().catch(() => "");
    return json({ error: `Discord 전송 실패: ${discordRes.status} ${text}` }, 502);
  }

  return json({ ok: true });
});

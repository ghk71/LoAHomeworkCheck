import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WEEK_DAY_NUMS = [3, 4, 5, 6, 0, 1, 2];
const DKO = ["일", "월", "화", "수", "목", "금", "토"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getWeekStartKst(off = 0) {
  const kst = new Date(Date.now() + 9 * 3600000);
  let back = (kst.getUTCDay() - 3 + 7) % 7;
  if (back === 0 && kst.getUTCHours() < 6) back = 7;
  const ws = new Date(kst);
  ws.setUTCDate(ws.getUTCDate() - back + off * 7);
  ws.setUTCHours(6, 0, 0, 0);
  return ws;
}

function weekKey(off = 0) {
  const ws = getWeekStartKst(off);
  return `${ws.getUTCFullYear()}-${String(ws.getUTCMonth() + 1).padStart(2, "0")}-${String(ws.getUTCDate()).padStart(2, "0")}`;
}

function weekWindow(off = 0) {
  const ws = getWeekStartKst(off);
  const wsMs = ws.getTime() - 9 * 3600000;
  return { ws, wsMs, weMs: wsMs + 7 * 24 * 3600000 };
}

function formatDate(d: Date) {
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
}

function weekRangeLabel(off = 0) {
  const start = getWeekStartKst(off);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return `${formatDate(start)} ~ ${formatDate(end)} 레이드 일정`;
}

function normalizeTime(v: unknown) {
  const raw = String(v || "").trim();
  if (!raw) return "";
  const m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return raw;
  const h = Number(m[1]);
  return m[2] === "00" ? `${h}시` : `${h}:${m[2]}`;
}

function sortTime(v: unknown) {
  const raw = String(v || "").trim();
  return raw || "99:99";
}

function isNonRaidName(name: unknown) {
  const text = String(name || "").trim();
  return !text || text.includes("교환");
}

function raidLabel(preset: any) {
  const name = String(preset?.name || "").trim();
  const diff = String(preset?.difficulty || "").trim();
  return diff ? `${name} ${diff}` : name;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const webhookUrl = Deno.env.get("DISCORD_RAID_WEBHOOK_URL");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!webhookUrl) return json({ error: "DISCORD_RAID_WEBHOOK_URL Secret이 없습니다." }, 500);
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase 기본 Secret이 없습니다." }, 500);

  const body = await req.json().catch(() => ({}));
  const off = Number.isFinite(Number(body.weekOffset)) ? Number(body.weekOffset) : 0;
  const wk = weekKey(off);
  const { wsMs, weMs } = weekWindow(off);
  const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const [
    accountsRes,
    charsRes,
    presetsRes,
    partiesRes,
    membersRes,
    schedulesRes,
    overridesRes,
    noticeRes,
  ] = await Promise.all([
    sb.from("accounts").select("*").order("sort_order").order("created_at"),
    sb.from("characters").select("*").order("sort_order").order("created_at"),
    sb.from("raid_presets").select("*").order("sort_order").order("created_at"),
    sb.from("raid_parties").select("*").order("sort_order").order("created_at"),
    sb.from("raid_party_members").select("*"),
    sb.from("raid_schedules").select("*").order("sort_order").order("created_at"),
    sb.from("raid_schedule_overrides").select("*").eq("week_start_date", wk),
    sb.from("raid_notices").select("*").eq("week_start_date", wk).maybeSingle(),
  ]);

  const firstError = [
    accountsRes,
    charsRes,
    presetsRes,
    partiesRes,
    membersRes,
    schedulesRes,
    overridesRes,
    noticeRes,
  ].find((r) => r.error)?.error;
  if (firstError) return json({ error: firstError.message }, 500);

  const accounts = accountsRes.data || [];
  const chars = charsRes.data || [];
  const presets = presetsRes.data || [];
  const parties = partiesRes.data || [];
  const members = membersRes.data || [];
  const schedules = schedulesRes.data || [];
  const overrides = overridesRes.data || [];
  const notice = noticeRes.data?.content || "없음";

  const accountById = new Map(accounts.map((a: any) => [a.id, a]));
  const presetById = new Map(presets.map((p: any) => [p.id, p]));
  const partyById = new Map(parties.map((p: any) => [p.id, p]));
  const memberByParty = new Map<string, any[]>();
  for (const m of members) {
    if (!memberByParty.has(m.party_id)) memberByParty.set(m.party_id, []);
    memberByParty.get(m.party_id)!.push(m);
  }
  for (const list of memberByParty.values()) list.sort((a, b) => (a.slot_index ?? 0) - (b.slot_index ?? 0));
  const overrideBySchedule = new Map(overrides.map((o: any) => [o.schedule_id, o]));

  const targetTopAccounts = accounts.filter((a: any) => !a.parent_account_id && a.hide_from_filters !== true);
  const groupCharSets = targetTopAccounts.map((acc: any) => {
    const ids = new Set<string>();
    for (const ch of chars) {
      const chAcc: any = accountById.get(ch.account_id);
      if (ch.account_id === acc.id || chAcc?.parent_account_id === acc.id) ids.add(ch.id);
    }
    return ids;
  }).filter((ids) => ids.size > 0);

  if (!groupCharSets.length) {
    return json({ error: "전송 대상 계정/캐릭터가 없습니다." }, 400);
  }

  const getEffectiveCharIds = (schedule: any) => {
    const party: any = partyById.get(schedule.party_id);
    if (!party) return [];
    const size = Number(party.party_size || 4);
    const base = memberByParty.get(party.id) || [];
    const override: any = overrideBySchedule.get(schedule.id);
    const slotOverrides = override?.slot_overrides || {};
    const ids: string[] = [];
    for (let i = 0; i < size; i += 1) {
      const key = String(i);
      const baseMember = base.find((m) => m.slot_index === i);
      const cid = Object.prototype.hasOwnProperty.call(slotOverrides, key)
        ? slotOverrides[key]
        : baseMember?.character_id;
      if (cid) ids.push(cid);
    }
    return [...new Set(ids)];
  };

  const rows = new Map<string, Set<string>>();
  for (const dn of WEEK_DAY_NUMS) {
    const daySchedules = schedules
      .filter((s: any) => {
        if (s.day_of_week !== dn) return false;
        if (s.is_fixed) return true;
        const t = new Date(s.created_at).getTime();
        return t >= wsMs && t < weMs;
      })
      .sort((a: any, b: any) => {
        const timeCmp = sortTime(a.time_str).localeCompare(sortTime(b.time_str));
        if (timeCmp) return timeCmp;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });

    for (const schedule of daySchedules) {
      const party: any = partyById.get(schedule.party_id);
      const preset: any = party ? presetById.get(party.preset_id) : null;
      if (!preset || isNonRaidName(preset.name)) continue;

      const charIds = getEffectiveCharIds(schedule);
      const includesAllGroups = groupCharSets.every((ids) => charIds.some((id) => ids.has(id)));
      if (!includesAllGroups) continue;

      const dayLabel = `${DKO[dn]}요일`;
      const timeLabel = normalizeTime(schedule.time_str);
      const key = timeLabel ? `${dayLabel} ${timeLabel}` : dayLabel;
      if (!rows.has(key)) rows.set(key, new Set());
      rows.get(key)!.add(raidLabel(preset));
    }
  }

  const scheduleLines = [...rows.entries()].map(([label, items]) => `${label}: ${[...items].join(", ")}`);
  const content = [
    weekRangeLabel(off),
    "",
    `**공지사항:** ${notice || "없음"}`,
    "",
    "레이드 일정",
    scheduleLines.length ? scheduleLines.join("\n") : "조건에 맞는 레이드 일정이 없습니다.",
  ].join("\n");

  const discordRes = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  });

  if (!discordRes.ok) {
    const text = await discordRes.text().catch(() => "");
    return json({ error: `Discord 전송 실패: ${discordRes.status} ${text}` }, 502);
  }

  return json({ ok: true, sentLines: scheduleLines.length, content });
});

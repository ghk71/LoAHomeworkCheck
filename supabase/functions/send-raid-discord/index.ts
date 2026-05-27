import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WEEK_DAY_NUMS = [3, 4, 5, 6, 0, 1, 2];
const DKO = ["일", "월", "화", "수", "목", "금", "토"];
const FIXED_SHARE_URL =
  "https://ghk71.github.io/LoAHomeworkCheck/raid.html?s=8msPYgSM2CUB&u=https%3A%2F%2Fwmritejklhggnzcwoxse.supabase.co";
const TARGET_ACCOUNT_GROUPS = [
  ["겊삶", "슈빙츄", "해용이", "무려억"],
  ["겊삶", "슈빙츄", "해용이"],
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseNowMs(value: unknown) {
  if (value == null || value === "") return Date.now();
  const ms = typeof value === "number" ? value : new Date(String(value)).getTime();
  return Number.isFinite(ms) ? ms : Date.now();
}

function getWeekStartKst(off = 0, nowMs = Date.now()) {
  const kst = new Date(nowMs + 9 * 3600000);
  let back = (kst.getUTCDay() - 3 + 7) % 7;
  if (back === 0 && kst.getUTCHours() < 6) back = 7;
  const ws = new Date(kst);
  ws.setUTCDate(ws.getUTCDate() - back + off * 7);
  ws.setUTCHours(6, 0, 0, 0);
  return ws;
}

function weekKey(off = 0, nowMs = Date.now()) {
  const ws = getWeekStartKst(off, nowMs);
  return `${ws.getUTCFullYear()}-${String(ws.getUTCMonth() + 1).padStart(2, "0")}-${String(ws.getUTCDate()).padStart(2, "0")}`;
}

function weekWindow(off = 0, nowMs = Date.now()) {
  const ws = getWeekStartKst(off, nowMs);
  const wsMs = ws.getTime() - 9 * 3600000;
  return { ws, wsMs, weMs: wsMs + 7 * 24 * 3600000 };
}

function formatDate(d: Date) {
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
}

function weekRangeLabel(off = 0, nowMs = Date.now()) {
  const start = getWeekStartKst(off, nowMs);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return `${formatDate(start)} ~ ${formatDate(end)} 레이드 일정`;
}

function dateLabelForDay(dayOfWeek: number, off = 0, nowMs = Date.now()) {
  const idx = WEEK_DAY_NUMS.indexOf(dayOfWeek);
  const d = getWeekStartKst(off, nowMs);
  d.setUTCDate(d.getUTCDate() + (idx >= 0 ? idx : 0));
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${DKO[dayOfWeek] || ""})`;
}

function sortTime(v: unknown) {
  const raw = String(v || "").trim();
  if (!raw) return "99:99";
  const m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return raw;
  return `${String(Number(m[1])).padStart(2, "0")}:${m[2]}`;
}

function asInt(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isInteger(n) ? n : fallback;
}

function cleanText(v: unknown) {
  return String(v || "").trim();
}

function isNonRaidName(name: unknown) {
  const text = cleanText(name);
  return !text || text.includes("교환");
}

function raidShortLabel(preset: any) {
  const name = cleanText(preset?.name);
  const diff = cleanText(preset?.difficulty);
  const shortName = cleanText(preset?.short_name);
  if (shortName) return shortName;
  return diff ? `${name} ${diff}` : name;
}

function waitWebhookUrl(webhookUrl: string) {
  return webhookUrl.includes("?") ? `${webhookUrl}&wait=true` : `${webhookUrl}?wait=true`;
}

function nextDeleteAfterKst(kind: "raid" | "homework", nowMs = Date.now()) {
  const spec = kind === "homework" ? { day: 3, hour: 6 } : { day: 2, hour: 22 };
  const now = new Date(nowMs);
  const kst = new Date(now.getTime() + 9 * 3600000);
  let addDays = (spec.day - kst.getUTCDay() + 7) % 7;
  let target = new Date(Date.UTC(
    kst.getUTCFullYear(),
    kst.getUTCMonth(),
    kst.getUTCDate() + addDays,
    spec.hour - 9,
    0,
    0,
  ));
  if (target <= now) {
    addDays += 7;
    target = new Date(Date.UTC(
      kst.getUTCFullYear(),
      kst.getUTCMonth(),
      kst.getUTCDate() + addDays,
      spec.hour - 9,
      0,
      0,
    ));
  }
  return target.toISOString();
}

async function trackDiscordMessage(sb: any, message: any, content: string, weekStartDate: string, nowMs: number) {
  if (!message?.id) return false;
  const { error } = await sb.from("discord_sent_messages").insert({
    kind: "raid",
    week_start_date: weekStartDate,
    webhook_env: "DISCORD_RAID_WEBHOOK_URL",
    message_id: String(message.id),
    delete_after: nextDeleteAfterKst("raid", nowMs),
    content_preview: content.slice(0, 500),
  });
  if (error) {
    console.warn("[discord-message-track]", error);
    return false;
  }
  return true;
}

function topAccountForCharacter(ch: any, accountById: Map<string, any>) {
  const account: any = accountById.get(ch?.account_id);
  if (!account) return null;
  if (account.parent_account_id) return accountById.get(account.parent_account_id) || account;
  return account;
}

function buildAccountCombo(charIds: string[], charById: Map<string, any>, accountById: Map<string, any>) {
  const byAccount = new Map<string, { accountName: string; charName: string }[]>();
  for (const charId of charIds) {
    const ch: any = charById.get(charId);
    const account = topAccountForCharacter(ch, accountById);
    const accountName = cleanText(account?.name);
    const charName = cleanText(ch?.short_name) || cleanText(ch?.name);
    if (!accountName || !charName) continue;
    if (!byAccount.has(accountName)) byAccount.set(accountName, []);
    byAccount.get(accountName)!.push({ accountName, charName });
  }

  for (const group of TARGET_ACCOUNT_GROUPS) {
    const chars: string[] = [];
    let ok = true;
    for (const accountName of group) {
      const list = byAccount.get(accountName) || [];
      if (list.length !== 1) {
        ok = false;
        break;
      }
      chars.push(list[0].charName);
    }
    if (ok) return { accounts: group, chars };
  }
  return null;
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
  const nowMs = parseNowMs(body.testNow);
  const off = Number.isFinite(Number(body.weekOffset)) ? Number(body.weekOffset) : 0;
  const wk = weekKey(off, nowMs);
  const { wsMs, weMs } = weekWindow(off, nowMs);
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
  const partiesAll = partiesRes.data || [];
  const members = membersRes.data || [];
  const schedules = schedulesRes.data || [];
  const overrides = overridesRes.data || [];
  const notice = cleanText(noticeRes.data?.content) || "없음";

  const accountById = new Map(accounts.map((a: any) => [a.id, a]));
  const charById = new Map(chars.map((c: any) => [c.id, c]));
  const presetById = new Map(presets.map((p: any) => [p.id, p]));

  const parties = partiesAll.filter((p: any) => !p.is_temporary || p.temp_week_start_date === wk);
  const partyById = new Map(parties.map((p: any) => [p.id, p]));

  const memberByParty = new Map<string, any[]>();
  for (const m of members) {
    if (!partyById.has(m.party_id)) continue;
    if (!memberByParty.has(m.party_id)) memberByParty.set(m.party_id, []);
    memberByParty.get(m.party_id)!.push(m);
  }
  for (const list of memberByParty.values()) list.sort((a, b) => (a.slot_index ?? 0) - (b.slot_index ?? 0));

  const overrideBySchedule = new Map(overrides.map((o: any) => [o.schedule_id, o]));

  const scheduleOverride = (schedule: any) => {
    const override: any = overrideBySchedule.get(schedule.id);
    return override?.schedule_overrides || {};
  };

  const effectiveDay = (schedule: any) => {
    const so = scheduleOverride(schedule);
    return Number.isInteger(Number(so.day_of_week)) ? Number(so.day_of_week) : Number(schedule.day_of_week);
  };

  const effectiveSort = (schedule: any) => {
    const so = scheduleOverride(schedule);
    return asInt(so.sort_order, asInt(schedule.sort_order, 0));
  };

  const effectiveTime = (schedule: any) => {
    const so = scheduleOverride(schedule);
    return Object.prototype.hasOwnProperty.call(so, "time_str") ? so.time_str : schedule.time_str;
  };

  const isScheduleInWeek = (schedule: any) => {
    if (!partyById.has(schedule.party_id)) return false;
    if (!WEEK_DAY_NUMS.includes(effectiveDay(schedule))) return false;
    if (schedule.is_fixed) return true;
    const t = new Date(schedule.created_at).getTime();
    return t >= wsMs && t < weMs;
  };

  const effectiveCharIds = (schedule: any) => {
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

  const rows = new Map<string, {
    dayOrder: number;
    items: { timeSort: string; sort: number; text: string }[];
  }>();
  const seen = new Set<string>();

  for (const schedule of schedules.filter(isScheduleInWeek)) {
    const party: any = partyById.get(schedule.party_id);
    const preset: any = party ? presetById.get(party.preset_id) : null;
    if (!preset || isNonRaidName(preset.name)) continue;

    const dayOfWeek = effectiveDay(schedule);
    const combo = buildAccountCombo(effectiveCharIds(schedule), charById, accountById);
    if (!combo) continue;

    const key = `${schedule.id}:${combo.accounts.join("/")}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const rowLabel = dateLabelForDay(dayOfWeek, off, nowMs);
    if (!rows.has(rowLabel)) {
      rows.set(rowLabel, { dayOrder: WEEK_DAY_NUMS.indexOf(dayOfWeek), items: [] });
    }
    rows.get(rowLabel)!.items.push({
      timeSort: sortTime(effectiveTime(schedule)),
      sort: effectiveSort(schedule),
      text: `- ${raidShortLabel(preset)}: ${combo.chars.join(", ")}`,
    });
  }

  const scheduleLines: string[] = [];
  for (const [label, row] of [...rows.entries()].sort(([, a], [, b]) => a.dayOrder - b.dayOrder)) {
    scheduleLines.push(label);
    row.items
      .sort((a, b) => {
        const timeCmp = a.timeSort.localeCompare(b.timeSort);
        if (timeCmp) return timeCmp;
        return a.sort - b.sort;
      })
      .forEach((item) => scheduleLines.push(item.text));
    scheduleLines.push("");
  }
  while (scheduleLines[scheduleLines.length - 1] === "") scheduleLines.pop();

  const content = [
    weekRangeLabel(off, nowMs),
    "",
    `공지사항: ${notice}`,
    "",
    scheduleLines.length ? scheduleLines.join("\n") : "조건에 맞는 레이드 일정이 없습니다.",
    "",
    `일정 참조: ${FIXED_SHARE_URL}`,
  ].join("\n");

  const discordRes = await fetch(waitWebhookUrl(webhookUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  });

  if (!discordRes.ok) {
    const text = await discordRes.text().catch(() => "");
    return json({ error: `Discord 전송 실패: ${discordRes.status} ${text}` }, 502);
  }
  const message = await discordRes.json().catch(() => null);
  const tracked = await trackDiscordMessage(sb, message, content, wk, nowMs);

  return json({ ok: true, sentLines: scheduleLines.filter((line) => line.startsWith("- ")).length, content, tracked, weekStartDate: wk });
});

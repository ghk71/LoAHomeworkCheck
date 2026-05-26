import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WEEK_DAY_NUMS = [3, 4, 5, 6, 0, 1, 2];

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
  return { wsMs, weMs: wsMs + 7 * 24 * 3600000 };
}

async function fetchAll(sb: any, table: string, select = "*") {
  const pageSize = 1000;
  const rows: any[] = [];
  for (let from = 0;; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await sb.from(table).select(select).range(from, to);
    if (error) throw error;
    const page = data || [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

function effectiveDay(schedule: any, overrideBySchedule: Map<string, any>) {
  const so = overrideBySchedule.get(schedule.id)?.schedule_overrides || {};
  return Number.isInteger(Number(so.day_of_week)) ? Number(so.day_of_week) : Number(schedule.day_of_week);
}

function scheduleInWeek(schedule: any, partyById: Map<string, any>, overrideBySchedule: Map<string, any>, wsMs: number, weMs: number) {
  if (!partyById.has(schedule.party_id)) return false;
  if (!WEEK_DAY_NUMS.includes(effectiveDay(schedule, overrideBySchedule))) return false;
  if (schedule.is_fixed) return true;
  const t = new Date(schedule.created_at).getTime();
  return t >= wsMs && t < weMs;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase 기본 Secret이 없습니다." }, 500);

  const body = await req.json().catch(() => ({}));
  const off = Number.isFinite(Number(body.weekOffset)) ? Number(body.weekOffset) : 0;
  const wk = weekKey(off);
  const { wsMs, weMs } = weekWindow(off);
  const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  try {
    const { data: sentRows, error: sentErr } = await sb
      .from("discord_sent_messages")
      .select("id,created_at,deleted_at")
      .eq("kind", "raid")
      .eq("week_start_date", wk)
      .limit(1);
    if (sentErr) throw sentErr;
    if ((sentRows || []).length) {
      return json({ ok: true, skipped: true, reason: "already-sent", weekStartDate: wk });
    }

    const [partiesAll, schedules, overrides] = await Promise.all([
      fetchAll(sb, "raid_parties"),
      fetchAll(sb, "raid_schedules"),
      fetchAll(sb, "raid_schedule_overrides"),
    ]);

    const parties = partiesAll.filter((p: any) => !p.is_temporary || p.temp_week_start_date === wk);
    const partyById = new Map(parties.map((p: any) => [p.id, p]));
    const overrideBySchedule = new Map(
      overrides
        .filter((o: any) => o.week_start_date === wk)
        .map((o: any) => [o.schedule_id, o]),
    );

    const scheduledPartyIds = new Set<string>();
    for (const schedule of schedules) {
      if (scheduleInWeek(schedule, partyById, overrideBySchedule, wsMs, weMs)) {
        scheduledPartyIds.add(schedule.party_id);
      }
    }

    const unplaced = parties.filter((p: any) => !scheduledPartyIds.has(p.id));
    if (unplaced.length) {
      return json({
        ok: true,
        skipped: true,
        reason: "unplaced-parties",
        weekStartDate: wk,
        unplacedCount: unplaced.length,
        unplacedPartyIds: unplaced.map((p: any) => p.id),
      });
    }

    const invokeRes = await fetch(`${supabaseUrl}/functions/v1/send-raid-discord`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ weekOffset: off, source: "auto-send-raid-discord" }),
    });
    const result = await invokeRes.json().catch(() => ({}));
    if (!invokeRes.ok || result?.error) {
      return json({ error: result?.error || `send-raid-discord 호출 실패: ${invokeRes.status}` }, 502);
    }
    return json({ ok: true, sent: true, weekStartDate: wk, unplacedCount: 0, result });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

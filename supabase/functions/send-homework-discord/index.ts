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

let requestNowMs = Date.now();

function parseNowMs(value: unknown) {
  if (value == null || value === "") return Date.now();
  const ms = typeof value === "number" ? value : new Date(String(value)).getTime();
  return Number.isFinite(ms) ? ms : Date.now();
}

function kstNow() {
  return new Date(requestNowMs);
}

function getMonthlyResetUTC(year: number, monthIndex: number) {
  const firstDay = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const firstWednesday = 1 + ((3 - firstDay + 7) % 7);
  return new Date(Date.UTC(year, monthIndex, firstWednesday - 1, 21, 0, 0, 0));
}

function getLastResetUTC(type: string, day = 3) {
  const now = kstNow();
  let result: Date;
  if (type === "daily") {
    result = new Date(now);
    result.setUTCHours(21, 0, 0, 0);
    if (now < result) result.setUTCDate(result.getUTCDate() - 1);
  } else if (type === "monthly") {
    const kst = new Date(now.getTime() + 9 * 3600000);
    result = getMonthlyResetUTC(kst.getUTCFullYear(), kst.getUTCMonth());
    if (now < result) result = getMonthlyResetUTC(kst.getUTCFullYear(), kst.getUTCMonth() - 1);
  } else {
    const rDay = (Number(day) + 6) % 7;
    result = new Date(now);
    result.setUTCHours(21, 0, 0, 0);
    let back = (now.getUTCDay() - rDay + 7) % 7;
    if (back === 0 && now < result) back = 7;
    result.setUTCDate(result.getUTCDate() - back);
  }
  return result;
}

function getPreviousResetBoundary(type: string, boundary: Date) {
  const prev = new Date(boundary);
  if (type === "daily") {
    prev.setUTCDate(prev.getUTCDate() - 1);
    return prev;
  }
  if (type === "monthly") {
    const kst = new Date(prev.getTime() + 9 * 3600000);
    return getMonthlyResetUTC(kst.getUTCFullYear(), kst.getUTCMonth() - 1);
  }
  prev.setUTCDate(prev.getUTCDate() - 7);
  return prev;
}

function getResetBoundariesSince(task: any, latest: Date) {
  const type = String(task.reset_type || "daily");
  const created = task.created_at ? new Date(task.created_at) : latest;
  const cursor = task.rest_last_processed_at ? new Date(task.rest_last_processed_at) : new Date(created.getTime() - 1000);
  const stack: Date[] = [];
  let b = new Date(latest);
  while (b > cursor && stack.length < 62) {
    stack.unshift(new Date(b));
    b = getPreviousResetBoundary(type, b);
  }
  return stack.filter((x) => x > cursor && x <= latest);
}

function effectiveRestCurrent(task: any) {
  if (!task.rest_enabled) return Number(task.rest_current || 0);
  const latest = getLastResetUTC(String(task.reset_type || "daily"), Number(task.reset_day ?? 3));
  let cur = Math.max(0, Number(task.rest_current) || 0);
  const max = Math.max(1, Number(task.rest_max) || 200);
  const charge = Math.max(0, Number(task.rest_charge) || 0);
  const completedAt = task.last_completed_at ? new Date(task.last_completed_at) : null;
  for (const b of getResetBoundariesSince(task, latest)) {
    const prev = getPreviousResetBoundary(String(task.reset_type || "daily"), b);
    const completedInCycle = !!(completedAt && completedAt > prev && completedAt <= b);
    if (!completedInCycle) cur = Math.min(max, cur + charge);
  }
  return cur;
}

function countIsCurrent(task: any) {
  return !!(task.last_completed_at && new Date(task.last_completed_at) > getLastResetUTC(String(task.reset_type || "daily"), Number(task.reset_day ?? 3)));
}

function isDone(task: any) {
  const current = countIsCurrent(task);
  if (task.rest_enabled) {
    const max = Math.max(1, Number(task.rest_daily_limit) || 1);
    if (current && Number(task.count_current || 0) >= max) return true;
  }
  if (task.count_max != null && current && Number(task.count_current || 0) >= Number(task.count_max || 0)) return true;
  return !!(task.is_completed && task.last_completed_at && new Date(task.last_completed_at) > getLastResetUTC(String(task.reset_type || "daily"), Number(task.reset_day ?? 3)));
}

function isActive(task: any) {
  if (task.rest_enabled && effectiveRestCurrent(task) < Number(task.rest_threshold || 0)) return false;
  if (task.activate_day == null) return true;
  return getLastResetUTC("weekly", Number(task.activate_day)) >= getLastResetUTC(String(task.reset_type || "daily"), Number(task.reset_day ?? 3));
}

function isDaily(task: any) {
  return String(task.reset_type || "daily") === "daily";
}

function isWeeklyMonthly(task: any) {
  return !isDaily(task);
}

function sortRows(rows: any[]) {
  return [...rows].sort((a, b) => {
    const sort = Number(a.sort_order || 0) - Number(b.sort_order || 0);
    if (sort) return sort;
    return String(a.created_at || "").localeCompare(String(b.created_at || ""));
  });
}

function incompleteRootLabels(rows: any[], predicate: (task: any) => boolean) {
  const filtered = rows.filter((task) => task.is_paused !== true && predicate(task));
  const childrenByParent = new Map<string, any[]>();
  for (const task of filtered) {
    if (!task.parent_id) continue;
    if (!childrenByParent.has(task.parent_id)) childrenByParent.set(task.parent_id, []);
    childrenByParent.get(task.parent_id)!.push(task);
  }
  const labels: string[] = [];
  for (const root of sortRows(filtered.filter((task) => !task.parent_id))) {
    if (!isActive(root) || isDone(root)) continue;
    const children = sortRows((childrenByParent.get(root.id) || []).filter(isActive));
    const incompleteChildren = children.filter((child) => !isDone(child));
    if (children.length && incompleteChildren.length) {
      labels.push(`${root.name}(${incompleteChildren.map((child) => child.name).join(", ")})`);
    } else {
      labels.push(String(root.name || "이름 없음"));
    }
  }
  return labels;
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

function pushChunks(chunks: string[], block: string) {
  const max = 1800;
  const append = (text: string) => {
    if (!text) return;
    if (!chunks.length) {
      chunks.push(text);
      return;
    }
    const merged = `${chunks[chunks.length - 1]}\n\n${text}`;
    if (merged.length <= max) chunks[chunks.length - 1] = merged;
    else chunks.push(text);
  };

  let current = "";
  const pushCurrent = () => {
    append(current);
    current = "";
  };

  const safeLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.length <= max) {
      safeLines.push(line);
      continue;
    }
    for (let i = 0; i < line.length; i += max) safeLines.push(line.slice(i, i + max));
  }

  for (const line of safeLines) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length > max) {
      pushCurrent();
      current = line;
    } else {
      current = next;
    }
  }
  pushCurrent();
}

function waitWebhookUrl(webhookUrl: string) {
  return webhookUrl.includes("?") ? `${webhookUrl}&wait=true` : `${webhookUrl}?wait=true`;
}

function nextDeleteAfterKst(kind: "raid" | "homework") {
  const spec = kind === "homework" ? { day: 3, hour: 6 } : { day: 2, hour: 22 };
  const now = kstNow();
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

function weekKey() {
  const kst = new Date(requestNowMs + 9 * 3600000);
  let back = (kst.getUTCDay() - 3 + 7) % 7;
  if (back === 0 && kst.getUTCHours() < 6) back = 7;
  const ws = new Date(kst);
  ws.setUTCDate(ws.getUTCDate() - back);
  ws.setUTCHours(6, 0, 0, 0);
  return `${ws.getUTCFullYear()}-${String(ws.getUTCMonth() + 1).padStart(2, "0")}-${String(ws.getUTCDate()).padStart(2, "0")}`;
}

async function trackDiscordMessage(sb: any, message: any, webhookEnv: string, content: string) {
  if (!message?.id) return false;
  const { error } = await sb.from("discord_sent_messages").insert({
    kind: "homework",
    week_start_date: weekKey(),
    webhook_env: webhookEnv,
    message_id: String(message.id),
    delete_after: nextDeleteAfterKst("homework"),
    content_preview: content.slice(0, 500),
  });
  if (error) {
    console.warn("[discord-message-track]", error);
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const homeworkWebhookUrl = Deno.env.get("DISCORD_HOMEWORK_WEBHOOK_URL");
  const webhookUrl = homeworkWebhookUrl || Deno.env.get("DISCORD_RAID_WEBHOOK_URL");
  const webhookEnv = homeworkWebhookUrl ? "DISCORD_HOMEWORK_WEBHOOK_URL" : "DISCORD_RAID_WEBHOOK_URL";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!webhookUrl) return json({ error: "DISCORD_HOMEWORK_WEBHOOK_URL 또는 DISCORD_RAID_WEBHOOK_URL Secret이 없습니다." }, 500);
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase 기본 Secret이 없습니다." }, 500);

  const body = await req.json().catch(() => ({}));
  requestNowMs = parseNowMs(body.testNow);
  const hiddenAccountIds = new Set<string>(Array.isArray(body.hiddenAccountIds) ? body.hiddenAccountIds.map(String) : []);
  const includeFilterHidden = body.includeFilterHidden === true;

  const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  try {
    const [accountsRaw, charsRaw, tasksRaw, expeditionTasksRaw] = await Promise.all([
      fetchAll(sb, "accounts"),
      fetchAll(sb, "characters"),
      fetchAll(sb, "tasks"),
      fetchAll(sb, "expedition_tasks"),
    ]);

    const accounts = sortRows(accountsRaw).filter((account) => !hiddenAccountIds.has(account.id) && (includeFilterHidden || account.hide_from_filters !== true));
    const accountIds = new Set(accounts.map((account) => account.id));
    const chars = sortRows(charsRaw).filter((ch) => accountIds.has(ch.account_id));
    const tasksByChar = new Map<string, any[]>();
    const expByAccount = new Map<string, any[]>();
    for (const ch of chars) tasksByChar.set(ch.id, []);
    for (const acc of accounts) expByAccount.set(acc.id, []);
    for (const task of tasksRaw) {
      if (!tasksByChar.has(task.character_id)) continue;
      tasksByChar.get(task.character_id)!.push(task);
    }
    for (const task of expeditionTasksRaw) {
      if (!expByAccount.has(task.account_id)) continue;
      expByAccount.get(task.account_id)!.push(task);
    }

    const charsByAccount = new Map<string, any[]>();
    for (const acc of accounts) charsByAccount.set(acc.id, []);
    for (const ch of chars) charsByAccount.get(ch.account_id)?.push(ch);

    let incompleteCount = 0;
    const chunks: string[] = [];
    for (const account of accounts) {
      const lines: string[] = [`[${account.name || "계정"}]`];
      const accountChars = charsByAccount.get(account.id) || [];
      for (const ch of accountChars) {
        const rows = tasksByChar.get(ch.id) || [];
        const daily = incompleteRootLabels(rows, isDaily);
        const weekly = incompleteRootLabels(rows, isWeeklyMonthly);
        if (!daily.length && !weekly.length) continue;
        incompleteCount += daily.length + weekly.length;
        lines.push(`- ${ch.name || "캐릭터"}: ${daily.length ? daily.join(", ") : "없음"} / ${weekly.length ? weekly.join(", ") : "없음"}`);
      }
      const expMissing = incompleteRootLabels(expByAccount.get(account.id) || [], () => true);
      if (expMissing.length) {
        incompleteCount += expMissing.length;
        lines.push(`- 완료하지 않은 계정 숙제: ${expMissing.join(", ")}`);
      }
      if (lines.length === 1) continue;
      pushChunks(chunks, lines.join("\n"));
    }

    if (!chunks.length) chunks.push("모든 숙제가 완료되었습니다.");

    let trackedCount = 0;
    for (const content of chunks) {
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
      if (await trackDiscordMessage(sb, message, webhookEnv, content)) trackedCount += 1;
    }

    return json({ ok: true, accountCount: accounts.length, incompleteCount, chunks: chunks.length, trackedCount });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

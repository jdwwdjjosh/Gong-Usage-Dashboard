import { getAggregateActivity, getCalls, getUsers } from "@/lib/gong";
import { finishSyncRun, startSyncRun, upsertActivitySummary, upsertCall, upsertUser } from "@/lib/db";

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeUser(raw: Record<string, unknown>) {
  const firstName = String(raw.firstName ?? "").trim();
  const lastName = String(raw.lastName ?? "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || String(raw.emailAddress ?? raw.id ?? "Unknown User");

  return {
    gong_user_id: String(raw.id ?? ""),
    email: String(raw.emailAddress ?? ""),
    name: fullName,
    active: raw.active === false ? 0 : 1,
    title: String(raw.title ?? ""),
    manager_id: String(raw.managerId ?? ""),
  };
}

function normalizeCall(raw: Record<string, unknown>) {
  return {
    call_id: String(raw.id ?? ""),
    gong_user_id: String(raw.primaryUserId ?? raw.userId ?? ""),
    started_at: String(raw.started ?? raw.dateTime ?? ""),
    duration_seconds: Number(raw.duration ?? 0),
    title: String(raw.title ?? "Untitled call"),
  };
}

function normalizeActivity(raw: Record<string, unknown>) {
  const activeDays = Number(raw.activeDays ?? raw.daysActive ?? raw.daysWithActivity ?? 0);
  const interactionCount = Number(raw.interactionCount ?? raw.totalActivities ?? raw.calls ?? 0);
  return {
    gong_user_id: String(raw.userId ?? raw.id ?? ""),
    active_days: activeDays,
    login_events_proxy: interactionCount,
    last_activity_at: raw.lastActivityAt ? String(raw.lastActivityAt) : null,
  };
}

export async function runSync() {
  const syncId = startSyncRun();

  try {
    const lookbackDays = Number(process.env.SYNC_LOOKBACK_DAYS ?? "30");
    const fromDateTime = isoDaysAgo(lookbackDays);
    const toDateTime = new Date().toISOString();

    const userResponse = await getUsers();
    const rawUsers = safeArray<Record<string, unknown>>(userResponse.users ?? userResponse.records);
    rawUsers.map(normalizeUser).filter((u) => u.gong_user_id).forEach(upsertUser);

    const callResponse = await getCalls(fromDateTime, toDateTime);
    const rawCalls = safeArray<Record<string, unknown>>(callResponse.calls ?? callResponse.records);
    rawCalls.map(normalizeCall).filter((c) => c.call_id).forEach(upsertCall);

    const activityResponse = await getAggregateActivity(fromDateTime, toDateTime);
    const rawActivity = safeArray<Record<string, unknown>>(activityResponse.records ?? activityResponse.results);
    rawActivity.map(normalizeActivity).filter((a) => a.gong_user_id).forEach(upsertActivitySummary);

    const message = `Synced ${rawUsers.length} users, ${rawCalls.length} calls, ${rawActivity.length} activity rows.`;
    finishSyncRun(syncId, "success", message);
    return { ok: true, message };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    finishSyncRun(syncId, "error", message);
    throw error;
  }
}

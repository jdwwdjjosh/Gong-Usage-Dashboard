import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { UserMetricRow } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "gong-dashboard.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    gong_user_id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    active INTEGER DEFAULT 1,
    title TEXT,
    manager_id TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS calls (
    call_id TEXT PRIMARY KEY,
    gong_user_id TEXT,
    started_at TEXT,
    duration_seconds INTEGER,
    title TEXT,
    synced_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS activity_summary (
    gong_user_id TEXT PRIMARY KEY,
    active_days INTEGER DEFAULT 0,
    login_events_proxy INTEGER DEFAULT 0,
    last_activity_at TEXT,
    synced_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sync_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    status TEXT NOT NULL,
    message TEXT
  );
`);

export function startSyncRun() {
  const startedAt = new Date().toISOString();
  const stmt = db.prepare(`INSERT INTO sync_runs (started_at, status) VALUES (?, ?)`);
  const result = stmt.run(startedAt, "running");
  return Number(result.lastInsertRowid);
}

export function finishSyncRun(id: number, status: "success" | "error", message?: string) {
  const stmt = db.prepare(`UPDATE sync_runs SET finished_at = ?, status = ?, message = ? WHERE id = ?`);
  stmt.run(new Date().toISOString(), status, message ?? null, id);
}

export function upsertUser(user: {
  gong_user_id: string;
  email: string;
  name: string;
  active: number;
  title: string;
  manager_id: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO users (gong_user_id, email, name, active, title, manager_id, updated_at)
    VALUES (@gong_user_id, @email, @name, @active, @title, @manager_id, @updated_at)
    ON CONFLICT(gong_user_id) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      active = excluded.active,
      title = excluded.title,
      manager_id = excluded.manager_id,
      updated_at = excluded.updated_at
  `);

  stmt.run({ ...user, updated_at: new Date().toISOString() });
}

export function upsertCall(call: {
  call_id: string;
  gong_user_id: string;
  started_at: string;
  duration_seconds: number;
  title: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO calls (call_id, gong_user_id, started_at, duration_seconds, title, synced_at)
    VALUES (@call_id, @gong_user_id, @started_at, @duration_seconds, @title, @synced_at)
    ON CONFLICT(call_id) DO UPDATE SET
      gong_user_id = excluded.gong_user_id,
      started_at = excluded.started_at,
      duration_seconds = excluded.duration_seconds,
      title = excluded.title,
      synced_at = excluded.synced_at
  `);

  stmt.run({ ...call, synced_at: new Date().toISOString() });
}

export function upsertActivitySummary(summary: {
  gong_user_id: string;
  active_days: number;
  login_events_proxy: number;
  last_activity_at: string | null;
}) {
  const stmt = db.prepare(`
    INSERT INTO activity_summary (gong_user_id, active_days, login_events_proxy, last_activity_at, synced_at)
    VALUES (@gong_user_id, @active_days, @login_events_proxy, @last_activity_at, @synced_at)
    ON CONFLICT(gong_user_id) DO UPDATE SET
      active_days = excluded.active_days,
      login_events_proxy = excluded.login_events_proxy,
      last_activity_at = excluded.last_activity_at,
      synced_at = excluded.synced_at
  `);

  stmt.run({ ...summary, synced_at: new Date().toISOString() });
}

export function getOverview() {
  const summary = db.prepare(`
    SELECT
      COUNT(*) AS total_users,
      SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active_users,
      COALESCE((SELECT COUNT(*) FROM calls), 0) AS total_calls,
      COALESCE((SELECT COUNT(*) FROM activity_summary WHERE active_days > 0), 0) AS engaged_users
    FROM users
  `).get() as {
    total_users: number;
    active_users: number;
    total_calls: number;
    engaged_users: number;
  };

  const users = db.prepare(`
    SELECT
      u.gong_user_id,
      u.name,
      u.email,
      u.active,
      COALESCE(c.calls_recorded, 0) AS calls_recorded,
      COALESCE(a.active_days, 0) AS active_days,
      COALESCE(a.login_events_proxy, 0) AS login_events_proxy,
      a.last_activity_at
    FROM users u
    LEFT JOIN (
      SELECT gong_user_id, COUNT(*) AS calls_recorded
      FROM calls
      GROUP BY gong_user_id
    ) c ON c.gong_user_id = u.gong_user_id
    LEFT JOIN activity_summary a ON a.gong_user_id = u.gong_user_id
    ORDER BY calls_recorded DESC, active_days DESC, u.name ASC
  `).all() as UserMetricRow[];

  const callTrend = db.prepare(`
    SELECT substr(started_at, 1, 10) AS day, COUNT(*) AS calls
    FROM calls
    WHERE started_at IS NOT NULL
    GROUP BY substr(started_at, 1, 10)
    ORDER BY day ASC
  `).all() as { day: string; calls: number }[];

  const syncRuns = db.prepare(`
    SELECT started_at, finished_at, status, message
    FROM sync_runs
    ORDER BY id DESC
    LIMIT 5
  `).all() as { started_at: string; finished_at: string | null; status: string; message: string | null }[];

  return { summary, users, callTrend, syncRuns };
}

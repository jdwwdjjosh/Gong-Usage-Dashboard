import { CallsByUserChart, CallTrendChart } from "@/components/Charts";
import { SyncButton } from "@/components/SyncButton";
import { getOverview } from "@/lib/db";

export default function HomePage() {
  const { summary, users, callTrend, syncRuns } = getOverview();

  return (
    <main className="container">
      <div className="header-actions">
        <div>
          <div className="page-title">Gong Usage Dashboard</div>
          <div className="page-subtitle">
            Starter dashboard for user adoption, activity, and call recording metrics.
          </div>
        </div>
        <SyncButton />
      </div>

      <div className="grid grid-4">
        <div className="card">
          <div className="kpi-label">Total users</div>
          <div className="kpi-value">{summary.total_users ?? 0}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Active users</div>
          <div className="kpi-value">{summary.active_users ?? 0}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Users with activity</div>
          <div className="kpi-value">{summary.engaged_users ?? 0}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Recorded calls</div>
          <div className="kpi-value">{summary.total_calls ?? 0}</div>
        </div>
      </div>

      <div className="row" style={{ marginTop: 20 }}>
        <div className="card">
          <h3>Calls over time</h3>
          <CallTrendChart data={callTrend} />
        </div>
        <div className="card">
          <h3>Top users by calls</h3>
          <CallsByUserChart users={users} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Latest sync runs</h3>
        <table>
          <thead>
            <tr>
              <th>Started</th>
              <th>Finished</th>
              <th>Status</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {syncRuns.length === 0 ? (
              <tr>
                <td colSpan={4}>No syncs yet.</td>
              </tr>
            ) : (
              syncRuns.map((run) => (
                <tr key={`${run.started_at}-${run.status}`}>
                  <td>{run.started_at}</td>
                  <td>{run.finished_at ?? "-"}</td>
                  <td>
                    <span className="badge">{run.status}</span>
                  </td>
                  <td>{run.message ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>User metrics</h3>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Calls recorded</th>
              <th>Active days</th>
              <th>Activity proxy</th>
              <th>Last activity</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6}>No data yet. Run a sync.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.gong_user_id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.calls_recorded}</td>
                  <td>{user.active_days}</td>
                  <td>{user.login_events_proxy}</td>
                  <td>{user.last_activity_at ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

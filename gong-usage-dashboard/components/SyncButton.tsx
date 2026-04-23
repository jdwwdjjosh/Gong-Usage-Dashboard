"use client";

import { useState } from "react";

export function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SYNC_API_TOKEN ?? ""}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Sync failed");
      }

      setMessage(data.message ?? "Sync completed.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleSync} disabled={loading}>
        {loading ? "Syncing..." : "Sync now"}
      </button>
      {message ? <div style={{ marginTop: 8, fontSize: 14 }}>{message}</div> : null}
    </div>
  );
}

const baseUrl = process.env.GONG_API_BASE_URL;
const accessKey = process.env.GONG_ACCESS_KEY;
const accessSecret = process.env.GONG_ACCESS_SECRET;

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getAuthHeader() {
  const raw = `${requireEnv(accessKey, "GONG_ACCESS_KEY")}:${requireEnv(accessSecret, "GONG_ACCESS_SECRET")}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

async function gongRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${requireEnv(baseUrl, "GONG_API_BASE_URL")}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gong request failed: ${response.status} ${body}`);
  }

  return response.json() as Promise<T>;
}

export async function getUsers() {
  return gongRequest<{ users?: unknown[]; records?: unknown[] }>("/v2/users");
}

export async function getCalls(fromDateTime: string, toDateTime: string) {
  const query = new URLSearchParams({ fromDateTime, toDateTime });
  return gongRequest<{ calls?: unknown[]; records?: unknown[] }>(`/v2/calls?${query.toString()}`);
}

export async function getAggregateActivity(fromDateTime: string, toDateTime: string) {
  return gongRequest<{ records?: unknown[]; results?: unknown[] }>("/v2/stats/activity/aggregate", {
    method: "POST",
    body: JSON.stringify({ fromDateTime, toDateTime }),
  });
}

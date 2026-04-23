import { runSync } from "@/lib/sync";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const expected = process.env.SYNC_API_TOKEN;
  const authHeader = request.headers.get("authorization") ?? "";
  const provided = authHeader.replace(/^Bearer\s+/i, "");

  if (expected && provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSync();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}

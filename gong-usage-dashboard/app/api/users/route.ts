import { getOverview } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(getOverview());
}

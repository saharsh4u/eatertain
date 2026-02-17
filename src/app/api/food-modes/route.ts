import { NextResponse } from "next/server";
import { getFoodModes } from "@/lib/recommend";

export async function GET() {
  return NextResponse.json({ foodModes: getFoodModes() }, { status: 200 });
}

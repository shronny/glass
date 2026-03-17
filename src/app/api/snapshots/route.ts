import { NextRequest, NextResponse } from "next/server";
import { createSnapshot, listSnapshots } from "@/entities/snapshots";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { month, year, notes } = body;

  const monthNum = Number(month);
  const yearNum = Number(year);
  if (!month || !year || !Number.isInteger(monthNum) || !Number.isInteger(yearNum) || monthNum < 1 || monthNum > 12 || yearNum < 2000 || yearNum > 2100) {
    return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
  }

  try {
    const snapshot = await createSnapshot(month, year, notes);
    return NextResponse.json(snapshot, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json({ error: "Snapshot already exists for this month" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const snapshots = await listSnapshots();
  return NextResponse.json(snapshots);
}


import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { eventNumber } = await request.json();

    if (!eventNumber) {
      return NextResponse.json(
        { error: "Event Number is required." },
        { status: 400 }
      );
    }

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT *
       FROM Vehicle_Stages
       WHERE Event_Number = ?
       ORDER BY Created_At ASC, VSSequance ASC`,
      [eventNumber]
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Vehicle stage details error:", error);

    return NextResponse.json(
      { error: "Unable to load vehicle stage details." },
      { status: 500 }
    );
  }
}

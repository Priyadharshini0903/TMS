
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { getSession } from "@/lib/plant";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.plantCode) {
      return NextResponse.json(
        { error: "Plant session not found." },
        { status: 401 }
      );
    }

    const { fromDate, toDate } = await request.json();

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: "From Date and To Date are required." },
        { status: 400 }
      );
    }

    if (fromDate > toDate) {
      return NextResponse.json(
        { error: "From Date cannot be later than To Date." },
        { status: 400 }
      );
    }

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT *
       FROM AutoYardIN_Results
       WHERE Created_at >= ?
         AND Created_at < DATE_ADD(?, INTERVAL 1 DAY)
         AND Plant_Code = ?
       ORDER BY Created_at DESC, Event_Number DESC`,
      [fromDate, toDate, session.plantCode]
    );

    return NextResponse.json({
      success: true,
      data: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error("Auto Yard In report error:", error);

    return NextResponse.json(
      { error: "Unable to generate Auto Yard In report." },
      { status: 500 }
    );
  }
}

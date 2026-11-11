import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { getSession } from "@/lib/plant";

export const dynamic = "force-dynamic";

type RFIDStageRow = RowDataPacket & {
  ID: number;
  gateLoc: string;
  trucksCount: number;
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.plantId) {
      return NextResponse.json(
        { error: "Plant session not found. Please log in again." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fromDate, toDate } = body;

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

    const startDate = `${fromDate} 00:00:00`;
    const endDateExclusive = `${toDate} 00:00:00`;

    const [rows] = await db.query<RFIDStageRow[]>(
      `SELECT
         ID,
         LOCATION AS gateLoc,
         COUNT(DISTINCT TRUCKNO) AS trucksCount
       FROM kcw_accsys.gaterfdatatbl
       WHERE UPDATETIME >= ?
         AND UPDATETIME < DATE_ADD(?, INTERVAL 1 DAY)
       GROUP BY LOCATION, ID
       ORDER BY ID ASC`,
      [startDate, endDateExclusive]
    );

    const totalTrucks = rows.reduce(
      (total, row) => total + Number(row.trucksCount || 0),
      0
    );

    return NextResponse.json({
      success: true,
      plantId: session.plantId,
      fromDate,
      toDate,
      totalTrucks,
      data: rows,
    });
  } catch (error) {
    console.error("RFID Sense report API error:", error);

    return NextResponse.json(
      { error: "Unable to generate RFID Sense report." },
      { status: 500 }
    );
  }
}

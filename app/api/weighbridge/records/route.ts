
import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { getSession } from "@/lib/plant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 401 }
      );
    }

    const id = Number(request.nextUrl.searchParams.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { message: "Invalid weighbridge ID" },
        { status: 400 }
      );
    }

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT
         RFNO,
         TRUCKNO,
         WEIGHT,
         STATUS,
         DatTim
       FROM wbdatatbl
       WHERE WBID = ?
         AND PlantCode = ?
       ORDER BY DatTim DESC
       LIMIT 60`,
      [id, session.plantId]
    );

    const records = rows.map((row, index) => ({
      sno: index + 1,
      rfno: row.RFNO,
      truckno: row.TRUCKNO,
      weight: row.WEIGHT,
      status: row.STATUS,
      timestamp: row.DatTim,
    }));

    return NextResponse.json({
      records,
      count: records.length,
      limit: 60,
    });
  } catch (error) {
    console.error("Weighbridge records API error:", error);

    return NextResponse.json(
      { message: "Unable to fetch weighbridge records" },
      { status: 500 }
    );
  }
}

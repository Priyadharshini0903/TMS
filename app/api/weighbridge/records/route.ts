
import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import {
  getSession,
  getWeighbridges,
  getRawWeighbridges,
} from "@/lib/plant";

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

    const mode =
      request.nextUrl.searchParams.get("mode") === "raw"
        ? "raw"
        : "regular";

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { message: "Invalid weighbridge ID" },
        { status: 400 }
      );
    }

    const weighbridges =
      mode === "raw"
        ? await getRawWeighbridges(session)
        : await getWeighbridges(session);

    if (!weighbridges.some((wb) => Number(wb.WBID) === id)) {
      return NextResponse.json(
        { message: "Weighbridge is not configured for this plant" },
        { status: 404 }
      );
    }

    const plantCode =
      mode === "raw" ? "ALR2" : session.plantId;

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
      [id, plantCode]
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


import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/plant";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.plantId) {
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }

    const { id } = await req.json();
    const bulkerId = Number(id);

    if (!Number.isInteger(bulkerId) || bulkerId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid Bulker ID" },
        { status: 400 }
      );
    }

    const [rows] = await db.execute(
      `SELECT *,
        SEC_TO_TIME(
          TIMESTAMPDIFF(SECOND, Center_Position, WeighService_End)
        ) AS TimeDifferenceFormatted
       FROM blkwbdatatbl
       WHERE WBID = ?
         AND PlantCode = ?
       ORDER BY DatTim DESC
       LIMIT 60`,
      [bulkerId, session.plantId]
    );

    return NextResponse.json({
      success: true,
      records: rows,
    });
  } catch (error) {
    console.error("Bulker last records error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to fetch Bulker records" },
      { status: 500 }
    );
  }
}

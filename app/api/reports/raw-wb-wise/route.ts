
import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { getSession } from "@/lib/plant";

export const dynamic = "force-dynamic";

type WeighbridgeRow = RowDataPacket & {
  WBID: number;
  LOCNAME: string;
};

type RawWBRow = RowDataPacket & {
  WBID: number;
  RFNO: string | null;
  TRUCKNO: string | null;
  WEIGHT: string | number | null;
  STATUS: string | null;
  DatTim: string | Date;
};

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.plantId) {
      return NextResponse.json(
        { error: "Plant session not found." },
        { status: 401 }
      );
    }

    const [rows] = await db.query<WeighbridgeRow[]>(
      `SELECT WBID, LOCNAME
       FROM plms_external_db.wbipconfig
       WHERE PlantCode = ?
         AND Field04 = ?
       ORDER BY WBID ASC`,
      [session.plantId, String(session.plantCode)]
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Raw WB dropdown error:", error);

    return NextResponse.json(
      { error: "Unable to load weighbridges." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.plantId) {
      return NextResponse.json(
        { error: "Plant session not found." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { date, weighbridge } = body;

    const conditions: string[] = ["PlantCode = ?"];
    const params: (string | number)[] = [session.plantId];

   if (date) {
  conditions.push("DatTim BETWEEN ? AND ?");
  params.push(`${date} 00:00:00`, `${date} 23:59:59`);
}

    if (weighbridge && weighbridge !== "ALL") {
      conditions.push("WBID = ?");
      params.push(Number(weighbridge));
    }

    const sql = `
      SELECT
        WBID,
        RFNO,
        TRUCKNO,
        WEIGHT,
        STATUS,
        DatTim
      FROM plms_external_db.wbdatatbl
      WHERE ${conditions.join(" AND ")}
      ORDER BY DatTim DESC
    `;

    const [rows] = await db.query<RawWBRow[]>(sql, params);

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Raw WB report error:", error);

    return NextResponse.json(
      { error: "Unable to generate Raw WB report." },
      { status: 500 }
    );
  }
}

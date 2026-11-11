
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { getSession } from "@/lib/plant";

export const dynamic = "force-dynamic";

type WeighbridgeOption = RowDataPacket & {
  WBID: number;
  LOCNAME: string;
};

type WBReportRow = RowDataPacket & {
  WBID: number;
  RFNO: string | null;
  TRUCKNO: string | null;
  WEIGHT: number | null;
  STATUS: string | null;
  DatTim: string | null;
  Center_Position: string | null;
  RfCard_Detect: string | null;
  EligibleSend: string | null;
  EligibleReply: string | null;
  StableCnt_Start: string | null;
  StableCnt_End: string | null;
  WeightService_Send: string | null;
  WeighService_End: string | null;
  TimeDifferenceFormatted: string | null;
};

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.plantId || !session?.plantCode) {
      return NextResponse.json(
        { error: "Plant session not found." },
        { status: 401 }
      );
    }

    const [rows] = await db.query<WeighbridgeOption[]>(
      `SELECT WBID, LOCNAME
       FROM wbipconfig
       WHERE Field04 = ?
         AND (PlantCode = ? OR PlantCode = 'LCW2')
       ORDER BY WBID ASC`,
      [session.plantCode, session.plantId]
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("WB dropdown API error:", error);

    return NextResponse.json(
      { error: "Unable to load weighbridges." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.plantId || !session?.plantCode) {
      return NextResponse.json(
        { error: "Plant session not found." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { date, weighbridge } = body;

    if (!date || !weighbridge) {
      return NextResponse.json(
        { error: "Date and weighbridge are required." },
        { status: 400 }
      );
    }

    if (
      weighbridge !== "ALL" &&
      !/^\d+$/.test(String(weighbridge))
    ) {
      return NextResponse.json(
        { error: "Invalid weighbridge selection." },
        { status: 400 }
      );
    }

    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;

    const plantColumn =
      Number(session.plantCode) === 3307 ? "Field01" : "PlantCode";

    const plantValue =
      Number(session.plantCode) === 3307
        ? session.plantCode
        : session.plantId;

    const params: (string | number)[] = [
      startDate,
      endDate,
      plantValue,
    ];

    let query = `
      SELECT *,
        SEC_TO_TIME(
          TIMESTAMPDIFF(
            SECOND,
            Center_Position,
            WeighService_End
          )
        ) AS TimeDifferenceFormatted
      FROM wbdatatbl
      WHERE DatTim BETWEEN ? AND ?
        AND ${plantColumn} = ?
    `;

    if (weighbridge !== "ALL") {
      query += " AND WBID = ?";
      params.push(Number(weighbridge));
    }

    query += " ORDER BY DatTim DESC";

    const [rows] = await db.query<WBReportRow[]>(query, params);

    return NextResponse.json({
      success: true,
      data: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error("WB Wise Report API error:", error);

    return NextResponse.json(
      { error: "Unable to generate WB Wise Report." },
      { status: 500 }
    );
  }
}

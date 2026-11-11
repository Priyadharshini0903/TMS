
import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { getSession } from "@/lib/plant";

export const dynamic = "force-dynamic";

type BulkerConfig = RowDataPacket & {
  WBID: number;
  ITEMNAME: string;
};

type BulkerRecord = RowDataPacket & {
  WBID: number;
  RFNO: string | null;
  TRUCKNO: string | null;
  WEIGHT: string | number | null;
  STATUS: string | null;
  DatTim: string | Date;
  Center_Position: string | Date | null;
  RfCard_Detect: string | Date | null;
  EligibleSend: string | Date | null;
  EligibleReply: string | Date | null;
  StableCnt_Start: string | Date | null;
  StableCnt_End: string | Date | null;
  WeightService_Send: string | Date | null;
  WeighService_End: string | Date | null;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.plantId) {
      return NextResponse.json(
        { error: "Plant session not found. Please log in again." },
        { status: 401 }
      );
    }

    const action = request.nextUrl.searchParams.get("action");

    if (action === "bulkers") {
      const [rows] = await db.query<BulkerConfig[]>(
        `SELECT WBID, ITEMNAME
         FROM plms_external_db.blkwbconfig
         WHERE PlantCode = ?
         ORDER BY WBID ASC`,
        [session.plantId]
      );

      return NextResponse.json({ success: true, data: rows });
    }

    return NextResponse.json(
      { error: "Invalid action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Bulker dropdown API error:", error);

    return NextResponse.json(
      { error: "Unable to load bulker configuration." },
      { status: 500 }
    );
  }
}

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

    const { reportType, selectedDate, weighbridge, truckNo } = body;

    let rows: BulkerRecord[];

    if (reportType === "date") {
      if (!selectedDate) {
        return NextResponse.json(
          { error: "Please select a date." },
          { status: 400 }
        );
      }

      const startDate = `${selectedDate} 00:00:00`;
      const endDate = `${selectedDate} 23:59:59`;

      if (weighbridge && weighbridge !== "ALL") {
        const [result] = await db.query<BulkerRecord[]>(
          `SELECT
             WBID,
             RFNO,
             TRUCKNO,
             WEIGHT,
             STATUS,
             DatTim,
             Center_Position,
             RfCard_Detect,
             EligibleSend,
             EligibleReply,
             StableCnt_Start,
             StableCnt_End,
             WeightService_Send,
             WeighService_End,
             PlantCode,
             Field01,
             Field02,
             Field03
           FROM plms_external_db.blkwbdatatbl
           WHERE WBID = ?
             AND DatTim BETWEEN ? AND ?
             AND PlantCode = ?
           ORDER BY DatTim DESC`,
          [weighbridge, startDate, endDate, session.plantId]
        );

        rows = result;
      } else {
        const [result] = await db.query<BulkerRecord[]>(
          `SELECT
             WBID,
             RFNO,
             TRUCKNO,
             WEIGHT,
             STATUS,
             DatTim,
             Center_Position,
             RfCard_Detect,
             EligibleSend,
             EligibleReply,
             StableCnt_Start,
             StableCnt_End,
             WeightService_Send,
             WeighService_End,
             PlantCode,
             Field01,
             Field02,
             Field03
           FROM plms_external_db.blkwbdatatbl
           WHERE DatTim BETWEEN ? AND ?
             AND PlantCode = ?
           ORDER BY DatTim DESC`,
          [startDate, endDate, session.plantId]
        );

        rows = result;
      }
    } else if (reportType === "truck") {
      const normalizedTruckNo = String(truckNo || "").trim();

      if (!normalizedTruckNo) {
        return NextResponse.json(
          { error: "Please enter the truck number." },
          { status: 400 }
        );
      }

      const [result] = await db.query<BulkerRecord[]>(
        `SELECT
           WBID,
           RFNO,
           TRUCKNO,
           WEIGHT,
           STATUS,
           DatTim,
           Center_Position,
           RfCard_Detect,
           EligibleSend,
           EligibleReply,
           StableCnt_Start,
           StableCnt_End,
           WeightService_Send,
           WeighService_End,
           PlantCode,
           Field01,
           Field02,
           Field03
         FROM plms_external_db.blkwbdatatbl
         WHERE TRUCKNO = ?
           AND PlantCode = ?
         ORDER BY DatTim DESC`,
        [normalizedTruckNo, session.plantId]
      );

      rows = result;
    } else {
      return NextResponse.json(
        { error: "Invalid report type." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Bulker report API error:", error);

    return NextResponse.json(
      { error: "Unable to generate bulker report." },
      { status: 500 }
    );
  }
}

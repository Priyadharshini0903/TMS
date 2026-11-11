
import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import { db } from "@/lib/db";
import { getSession } from "@/lib/plant";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { message: "Session expired. Please login again." },
        { status: 401 }
      );
    }

    const params = request.nextUrl.searchParams;
    const action = params.get("action");

    const plantCode = String(session.plantCode);
    const plantId = String(session.plantId);

    // Original PHP: get_wbs()
    if (action === "weighbridges") {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT *
         FROM wbipconfig
         WHERE Field04 = ?
           AND (PlantCode = ? OR PlantCode = 'LCW2')
         ORDER BY WBID ASC`,
        [plantCode, plantId]
      );

      return NextResponse.json(
        rows.map((row) => ({
          WBID: row.WBID,
          LOCNAME: row.LOCNAME,
        }))
      );
    }

    const reqType = params.get("reqType");
    const date = params.get("date");
    const weighbridge = params.get("weighbridge");
    const truckNo = params.get("truckNo")?.trim();

    let sql = "";
    const values: (string | number)[] = [];

    const selectFields = `
      SELECT
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
        SEC_TO_TIME(
          TIMESTAMPDIFF(
            SECOND,
            Center_Position,
            WeighService_End
          )
        ) AS TimeDifferenceFormatted
      FROM wbdatatbl
    `;

    // Original PHP: get_wbwise_report_byDateWeighbridge()
    if (reqType === "DateWithWb") {
      if (!date || !weighbridge) {
        return NextResponse.json(
          { message: "Please select date and weighbridge." },
          { status: 400 }
        );
      }

      const fromDate = `${date} 00:00:00`;
      const toDate = `${date} 23:59:59`;

      if (plantCode === "3307") {
        if (weighbridge === "ALL") {
          sql = `
            ${selectFields}
            WHERE DatTim BETWEEN ? AND ?
              AND Field01 = ?
            ORDER BY DatTim DESC
          `;
          values.push(fromDate, toDate, plantCode);
        } else {
          sql = `
            ${selectFields}
            WHERE WBID = ?
              AND DatTim BETWEEN ? AND ?
              AND Field01 = ?
            ORDER BY DatTim DESC
          `;
          values.push(Number(weighbridge), fromDate, toDate, plantCode);
        }
      } else {
        if (weighbridge === "ALL") {
          sql = `
            ${selectFields}
            WHERE DatTim BETWEEN ? AND ?
              AND PlantCode = ?
            ORDER BY DatTim DESC
          `;
          values.push(fromDate, toDate, plantId);
        } else {
          sql = `
            ${selectFields}
            WHERE WBID = ?
              AND DatTim BETWEEN ? AND ?
              AND PlantCode = ?
            ORDER BY DatTim DESC
          `;
          values.push(Number(weighbridge), fromDate, toDate, plantId);
        }
      }
    }

    // Original PHP: get_wbwise_report_byTruckNo()
    else if (reqType === "TruckOnly") {
      if (!truckNo) {
        return NextResponse.json(
          { message: "Please enter truck number." },
          { status: 400 }
        );
      }

      if (plantCode === "3700") {
        sql = `
          ${selectFields}
          WHERE TRUCKNO = ?
            AND Field01 = ?
          ORDER BY DatTim DESC
        `;
        values.push(truckNo, plantCode);
      } else {
        sql = `
          ${selectFields}
          WHERE TRUCKNO = ?
            AND PlantCode = ?
          ORDER BY DatTim DESC
        `;
        values.push(truckNo, plantId);
      }
    } else {
      return NextResponse.json(
        { message: "Invalid report request." },
        { status: 400 }
      );
    }

    const [rows] = await db.query<RowDataPacket[]>(sql, values);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[WEIGHBRIDGE WISE REPORT ERROR]", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to load report.",
      },
      { status: 500 }
    );
  }
}

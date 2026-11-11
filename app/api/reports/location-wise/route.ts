
import { NextRequest, NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import { getSession, getGatePool, getGates } from "@/lib/plant";

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

    const pool = await getGatePool(session);
    const params = request.nextUrl.searchParams;
    const action = params.get("action");

    if (action === "locations") {
      const rows = await getGates(session);

      return NextResponse.json(
        rows.map((row) => ({
          SID: row.SID,
          LOCNAME: row.LOCATION,
        }))
      );
    }

    const truckNo = params.get("truckNo")?.trim();
    const date = params.get("date");
    const location = params.get("location");

    let sql = "";
    const values: (string | number)[] = [];

    const selectFields = `
      SELECT
        SID,
        ID,
        LOCATION AS LOCSTR,
        RFNO,
        TRUCKNO,
        STAGE AS STATUS,
        RESPONSE,
        UPDATETIME AS DatTim
      FROM gaterfdatatbl
    `;

    if (truckNo) {
      sql = `
        ${selectFields}
        WHERE TRUCKNO = ?
        ORDER BY UPDATETIME DESC
      `;

      values.push(truckNo);
    } else {
      if (!date || !location || location === "ALL") {
        return NextResponse.json(
          { message: "Please select a date and location." },
          { status: 400 }
        );
      }

      sql = `
        ${selectFields}
        WHERE ID = ?
          AND UPDATETIME BETWEEN ? AND ?
        ORDER BY UPDATETIME DESC
      `;

      values.push(
        Number(location),
        `${date} 00:00:00`,
        `${date} 23:59:59`
      );
    }

    const [rows] = await pool.query<RowDataPacket[]>(sql, values);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[LOCATION WISE REPORT API ERROR]", error);

    const message =
      error instanceof Error ? error.message : "Unknown database error";

    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "development"
            ? message
            : "Unable to load location-wise report.",
      },
      { status: 500 }
    );
  }
}

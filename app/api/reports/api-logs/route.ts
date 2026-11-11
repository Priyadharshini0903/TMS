
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getSession, getGatePool } from "@/lib/plant";

export const dynamic = "force-dynamic";

type LogType = {
  GATESTR: string;
};

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.plantCode) {
      return NextResponse.json(
        { error: "Plant session not found." },
        { status: 401 }
      );
    }

    const pool = await getGatePool(session);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT GATESTR
       FROM gaterfconfig
       WHERE PLANTID = ?
       ORDER BY SID ASC`,
      [session.plantCode]
    );

    return NextResponse.json({
      success: true,
      data: rows as LogType[],
    });
  } catch (error) {
    console.error("API Logs dropdown error:", error);

    return NextResponse.json(
      { error: "Unable to load log types." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.plantCode) {
      return NextResponse.json(
        { error: "Plant session not found." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fromDate, toDate, transactionType, logType } = body;

    if (!fromDate || !toDate || !transactionType) {
      return NextResponse.json(
        { error: "From Date, To Date and Transaction Type are required." },
        { status: 400 }
      );
    }

    if (fromDate > toDate) {
      return NextResponse.json(
        { error: "From Date cannot be later than To Date." },
        { status: 400 }
      );
    }

    if (!["OUTBOUND", "INBOUND"].includes(transactionType)) {
      return NextResponse.json(
        { error: "Invalid transaction type." },
        { status: 400 }
      );
    }

    if (
      transactionType === "OUTBOUND" &&
      typeof logType !== "string"
    ) {
      return NextResponse.json(
        { error: "Please select a log type." },
        { status: 400 }
      );
    }

    const pool = await getGatePool(session);

    const startDate = `${fromDate} 00:00:00`;
    const endDate = `${toDate} 23:59:59`;

    let query = "";
    const params: (string | number)[] = [];

    if (transactionType === "INBOUND") {
      query = `
        SELECT *
        FROM gaterflogs
        WHERE (
          FIELD02 LIKE '%INBOUND%'
          OR SERVICE_IDENTIFIER LIKE '%INBOUND%'
        )
        AND LOGTIME BETWEEN ? AND ?
        ORDER BY LOGTIME DESC
      `;

      params.push(startDate, endDate);
    } else if (logType === "SAP") {
      query = `
        SELECT *
        FROM gaterflogs
        WHERE SAP_IDENTIFIER = 1
          AND LOGTIME BETWEEN ? AND ?
        ORDER BY LOGTIME DESC
      `;

      params.push(startDate, endDate);
    } else {
      query = `
        SELECT *
        FROM gaterflogs
        WHERE PAYLOAD LIKE ?
          AND LOGTIME BETWEEN ? AND ?
        ORDER BY LOGTIME DESC
      `;

      const payloadPattern =
        logType === ""
          ? '%"identifier":"%'
          : `%"identifier":"${logType}%`;

      params.push(payloadPattern, startDate, endDate);
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return NextResponse.json({
      success: true,
      data: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error("API Logs report error:", error);

    return NextResponse.json(
      { error: "Unable to generate API Logs report." },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { getSession } from "@/lib/plant";

export const dynamic = "force-dynamic";

type TransactionLog = RowDataPacket & {
  Id: number;
  LoadId: string | null;
  TruckNo: string | null;
  Identifier: string | null;
  TransactionResult: string | null;
  Request: string | null;
  Response: string | null;
  Request_TimeStamp: string | null;
  Response_TimeStamp: string | null;
  TransactionType: string | null;
  TransactionType_II: string | null;
  SourceUser: string | null;
  SourceMachine: string | null;
  Timestamp: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.plantCode) {
      return NextResponse.json(
        { error: "Plant session not found. Please log in again." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { fromDate, toDate, transactionType } = body;

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

    const allowedTypes = [
      "OUTBOUND",
      "INBOUND",
      "AUTO YARD IN",
      "MANUAL YARD IN",
    ];

    if (!allowedTypes.includes(transactionType)) {
      return NextResponse.json(
        { error: "Invalid transaction type." },
        { status: 400 }
      );
    }

    const startDate = `${fromDate} 00:00:00`;
    const endDateExclusive = `${toDate} 00:00:00`;

    const [rows] = await db.query<TransactionLog[]>(
      `SELECT *
       FROM APILogs
       WHERE TransactionType = ?
         AND Timestamp >= ?
         AND Timestamp < DATE_ADD(?, INTERVAL 1 DAY)
         AND PlantCode = ?
       ORDER BY Timestamp DESC, Id DESC`,
      [
        transactionType,
        startDate,
        endDateExclusive,
        session.plantCode,
      ]
    );

    return NextResponse.json({
      success: true,
      data: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error("Transaction Logs API error:", error);

    return NextResponse.json(
      { error: "Unable to generate Transaction Logs Report." },
      { status: 500 }
    );
  }
}

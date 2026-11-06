import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { plantId, plantCode } = await req.json();
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT 1 FROM VersionTbl_qa WHERE PlantcodeName = ? AND Plantcode = ? AND tmpDelete = 0 LIMIT 1",
      [plantId, plantCode]
    );
    if (!rows.length)
      return NextResponse.json({ error: `Invalid plant: ${plantId} | ${plantCode}` }, { status: 400 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set("plant", `${plantId}|${plantCode}`, { httpOnly: true, path: "/", sameSite: "lax" });
    return res;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
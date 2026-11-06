
import { NextResponse } from "next/server";
import { getSession, getWeighbridges } from "@/lib/plant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 401 }
      );
    }

    const weighbridges = await getWeighbridges(session);

    return NextResponse.json(
      weighbridges.map((wb) => ({
        WBID: Number(wb.WBID),
        LOCNAME: wb.LOCNAME ?? `WEIGHBRIDGE ${wb.WBID}`,
      })),
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Weighbridge list API error:", error);

    return NextResponse.json(
      { message: "Unable to load weighbridges" },
      { status: 500 }
    );
  }
}

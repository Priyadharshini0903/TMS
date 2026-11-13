
import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  getWeighbridges,
  getRawWeighbridges,
} from "@/lib/plant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 401 }
      );
    }

    const mode =
      request.nextUrl.searchParams.get("mode") === "raw"
        ? "raw"
        : "regular";

    const weighbridges =
      mode === "raw"
        ? await getRawWeighbridges(session)
        : await getWeighbridges(session);

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

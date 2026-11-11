
import { NextResponse } from "next/server";
import { getSession } from "@/lib/plant";

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

    return NextResponse.json({
      plantId: session.plantId,
      plantCode: session.plantCode,
    });
  } catch (error) {
    console.error("Plant info error:", error);

    return NextResponse.json(
      { message: "Unable to load plant information" },
      { status: 500 }
    );
  }
}

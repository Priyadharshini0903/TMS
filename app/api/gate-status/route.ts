
import { getSession, getGatePool } from "@/lib/plant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));

  // 1. Validate request
  if (!Number.isSafeInteger(id) || id <= 0) {
    return Response.json(
      { success: false, message: "Invalid gate ID." },
      { status: 400 }
    );
  }

  try {
    // 2. Validate session
    const session = await getSession();

    if (!session) {
      return Response.json(
        { success: false, message: "Your session has expired. Please log in again." },
        { status: 401 }
      );
    }

    // 3. Get database connection
    const pool = await getGatePool(session);

    // 4. Fetch latest 60 records
    const [rows] = await pool.query(
      `SELECT STAGE, RFNO, TRUCKNO, RESPONSE, UPDATETIME
       FROM gaterfdatatbl
       WHERE ID = ?
       ORDER BY UPDATETIME DESC
       LIMIT 60`,
      [id]
    );

    // 5. Successful response (even when no records exist)
    return Response.json(rows, {
      status: 200,
      headers: {
        "Cache-Control": "no-store"
      }
    });

  } catch (error) {
    // 6. Log detailed error on server only
    console.error("[GATE RECORDS API ERROR]", {
      gateId: id,
      error
    });

    // 7. Return safe error to frontend
    return Response.json(
      {
        success: false,
        message: "Unable to load gate records. Please try again later."
      },
      { status: 500 }
    );
  }
}

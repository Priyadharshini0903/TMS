import { getSession, getGatePool } from "@/lib/plant";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  const s = await getSession();
  if (!s || !(id > 0)) return Response.json([], { status: 400 });
  try {
    const pool = await getGatePool(s);
    const [rows] = await pool.query(
      "SELECT RFNO, TRUCKNO, STATUS, DatTim FROM gaterfdatatbl WHERE ID = ? ORDER BY UPDATETIME DESC LIMIT 60",
      [id]
    );
    return Response.json(rows);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
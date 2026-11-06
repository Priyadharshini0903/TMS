import WebSocket from "ws";
import { getSession, getPlant } from "@/lib/plant";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  const s = await getSession();
  if (!s || !(id > 0))
    return Response.json({ error: true, SID: id, message: "Invalid request" }, { status: 400 });
  try {
    const plant = await getPlant(s);
    if (!plant?.truckRegIP) throw new Error("Truck registration IP not set");
    const data = await new Promise<string>((resolve, reject) => {
      const ws = new WebSocket(`ws://${plant.truckRegIP}:4488`, { handshakeTimeout: 4000 });
      const t = setTimeout(() => { ws.terminate(); reject(new Error("Socket timeout")); }, 10000);
      ws.on("open", () => ws.send(JSON.stringify([id])));
      ws.on("message", (m) => { clearTimeout(t); ws.close(); resolve(m.toString()); });
      ws.on("error", (e) => { clearTimeout(t); reject(e); });
    });
    return new Response(data, { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return Response.json({ error: true, SID: id, message: (e as Error).message }, { status: 500 });
  }
}
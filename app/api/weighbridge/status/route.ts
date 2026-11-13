import net from "node:net";
import {
  getSession,
  getPlant,
  getWeighbridges,
  getRawWeighbridges,
} from "@/lib/plant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readWeighbridgeResponse(
  host: string,
  port: number,
  weighbridgeId: number,
) {
  return new Promise<string>((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    let response = "";
    let settled = false;
    let quietTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      if (quietTimer) clearTimeout(quietTimer);
      socket.destroy();
      if (error) reject(error);
      else if (response.trim()) resolve(response.trim());
      else
        reject(new Error("Weighbridge controller returned an empty response"));
    };

    socket.setTimeout(5000);
    socket.on("connect", () => {
      socket.write(JSON.stringify([weighbridgeId]), (error) => {
        if (error) finish(error);
      });
    });
    socket.on("data", (chunk: Buffer) => {
      response += chunk.toString("utf8");
      // The PHP implementation reads one response from the TCP stream.
      // Wait briefly for any additional TCP chunks before returning it.
      if (quietTimer) clearTimeout(quietTimer);
      quietTimer = setTimeout(() => finish(), 150);
    });
    socket.on("end", () => finish());
    socket.on("timeout", () =>
      finish(new Error("Weighbridge controller connection timed out")),
    );
    socket.on("error", (error) => finish(error));
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  const mode = url.searchParams.get("mode") === "raw" ? "raw" : "regular";
  const session = await getSession();

  if (!session || !Number.isInteger(id) || id <= 0) {
    return Response.json(
      { error: true, message: "Invalid session or weighbridge ID" },
      { status: 400 },
    );
  }

  try {
    // Only allow a WBID configured for the currently selected plant.
    const weighbridges =
      mode === "raw"
        ? await getRawWeighbridges(session)
        : await getWeighbridges(session);
    if (!weighbridges.some((wb) => Number(wb.WBID) === id)) {
      return Response.json(
        {
          error: true,
          message: "Weighbridge is not configured for this plant",
        },
        { status: 404 },
      );
    }

    const plant = await getPlant(session);
    const host = String(plant?.WBIP ?? "").trim();
    const port = Number(plant?.wbPort);

    if (!host || !Number.isInteger(port) || port <= 0 || port > 65535) {
      throw new Error(
        "Weighbridge controller IP or port is not configured for this plant",
      );
    }

    const response = await readWeighbridgeResponse(host, port, id);
    return new Response(response, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to read weighbridge status";
    return Response.json({ error: true, WBID: id, message }, { status: 502 });
  }
}

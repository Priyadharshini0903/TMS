
import { NextResponse } from "next/server";
import WebSocket from "ws";
import { getSession, getPlant } from "@/lib/plant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkDevice(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new WebSocket(`ws://${host}:${port}`);

    let settled = false;
    let responseTimer: NodeJS.Timeout | undefined;

    const connectTimer = setTimeout(() => finish(false), 4000);

    function finish(connected: boolean) {
      if (settled) return;
      settled = true;

      clearTimeout(connectTimer);
      if (responseTimer) clearTimeout(responseTimer);

      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      } else if (socket.readyState === WebSocket.CONNECTING) {
        socket.terminate();
      }

      resolve(connected);
    }

    socket.once("open", () => {
      clearTimeout(connectTimer);

      socket.send(JSON.stringify([1]));

      responseTimer = setTimeout(() => finish(false), 10000);
    });

    socket.once("message", () => finish(true));

    socket.once("error", () => finish(false));

    socket.once("close", () => {
      if (!settled) finish(false);
    });
  });
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { connected: false, message: "Session not found" },
        { status: 401 }
      );
    }

    const plant = await getPlant(session);
    const host = String(plant?.truckRegIP ?? "").trim();
    const port = Number(process.env.TRUCK_REG_PORT ?? 4488);

    if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
      return NextResponse.json({
        connected: false,
        message: "Device configuration not found",
      });
    }

    const connected = await checkDevice(host, port);

    return NextResponse.json({
      connected,
      message: connected ? "Connected" : "Disconnected",
    });
  } catch (error) {
    console.error("Connection status error:", error);

    return NextResponse.json({
      connected: false,
      message: "Disconnected",
    });
  }
}

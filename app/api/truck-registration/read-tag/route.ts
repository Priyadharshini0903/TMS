
import { NextRequest, NextResponse } from "next/server";
import WebSocket from "ws";
import { getSession, getPlant } from "@/lib/plant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readGateTag(host: string, port: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://${host}:${port}`);

    let settled = false;
    let responseTimer: ReturnType<typeof setTimeout>;

    const connectTimer = setTimeout(() => {
      finish(new Error("WebSocket connection timed out"));
    }, 4000);

    function finish(error?: Error, result?: unknown) {
      if (settled) return;
      settled = true;

      clearTimeout(connectTimer);
      clearTimeout(responseTimer);

      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      } else if (socket.readyState === WebSocket.CONNECTING) {
        socket.terminate();
      }

      if (error) reject(error);
      else resolve(result);
    }

    socket.once("open", () => {
      clearTimeout(connectTimer);

      socket.send(JSON.stringify([1]));

      responseTimer = setTimeout(() => {
        finish(new Error("No response received from the RFID device"));
      }, 10000);
    });

    socket.once("message", (data) => {
      const message = data.toString();

      try {
        finish(undefined, JSON.parse(message));
      } catch {
        finish(new Error("Invalid response received from RFID device"));
      }
    });

    socket.once("error", () => {
      finish(new Error("Unable to connect to RFID device"));
    });

    socket.once("close", () => {
      if (!settled) {
        finish(new Error("RFID connection closed before receiving data"));
      }
    });
  });
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 401 }
      );
    }

    const plant = await getPlant(session);
    const host = String(plant?.truckRegIP ?? "").trim();

    // PHP uses TCPPORT = 4488.
    const port = Number(process.env.TRUCK_REG_PORT ?? 4488);

    if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
      return NextResponse.json(
        { success: false, message: "Truck registration device is not configured" },
        { status: 400 }
      );
    }

    const data = await readGateTag(host, port);

    const tagNumber =
      session.plantId.toUpperCase() === "UMG"
        ? (data as Record<string, unknown>)?.L2REGTAG
        : (data as Record<string, unknown>)?.REGTAG;

    if (tagNumber === undefined || tagNumber === null || String(tagNumber).trim() === "") {
      return NextResponse.json({
        success: false,
        message: "No RFID tag detected",
        data,
      });
    }

    return NextResponse.json({
      success: true,
      tagNo: String(tagNumber).trim(),
      message: "RFID tag read successfully",
    });
  } catch (error) {
    console.error("Read Tag API error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unable to read RFID tag",
      },
      { status: 500 }
    );
  }
}

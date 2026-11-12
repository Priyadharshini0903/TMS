
import { NextRequest, NextResponse } from "next/server";
import net from "node:net";

// Change this IP whenever you test with another Bulker controller.
const BULKER_IP = "192.168.1.100";
const BULKER_PORT = 4477;

export const runtime = "nodejs";

function readBulkerStatus(id: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let response = "";
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();

      if (error) reject(error);
      else resolve(response);
    };

    socket.setTimeout(5000);

    socket.connect(BULKER_PORT, BULKER_IP, () => {
      // Same request format as PHP: json_encode([$_POST['id']])
      socket.write(JSON.stringify([id]));
    });

    socket.on("data", (data) => {
      response += data.toString();

      // The PHP code reads once. We wait briefly for the response
      // to finish arriving before returning it.
      socket.setTimeout(500);
    });

    socket.on("timeout", () => {
      if (response) finish();
      else finish(new Error("Bulker controller timed out."));
    });

    socket.on("end", () => finish());

    socket.on("error", (error) => finish(error));
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body.id ?? "").trim();

    if (!id) {
      return NextResponse.json(
        { message: "Bulker ID is required." },
        { status: 400 }
      );
    }

    const response = await readBulkerStatus(id);

    return NextResponse.json({ success: true, response });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unable to connect to Bulker.",
      },
      { status: 500 }
    );
  }
}

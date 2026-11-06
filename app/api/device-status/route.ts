
import { NextResponse } from "next/server";
import net from "node:net";
import { getSession, getPlant } from "@/lib/plant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Device = {
  LOCNAME?: string;
  RFID1IP?: string;
  RF1STAT?: string;
  RFID2IP?: string;
  RF2STAT?: string;
  WB1DSPIP?: string;
  WB1DSPSTAT?: string;
  WB2DSPIP?: string;
  WB2DSPSTAT?: string;
  WBINDIP?: string;
  WBINDSTAT?: string;
  WBCTRIP?: string;
  WBCTRSTAT?: string;
};

function parseDeviceResponse(raw: string): Device[] {
  const outer = JSON.parse(raw);

  if (!Array.isArray(outer)) {
    throw new Error("Unexpected device response format");
  }

  const devices: Device[] = [];

  for (const item of outer) {
    if (typeof item !== "string") continue;

    const inner = JSON.parse(item);

    if (!Array.isArray(inner)) continue;

    for (const entry of inner) {
      if (typeof entry !== "string") continue;

      const device = JSON.parse(entry);

      if (device && typeof device === "object") {
        devices.push(device as Device);
      }
    }
  }

  return devices;
}

function readTcpDevices(
  host: string,
  port: number,
  count: number,
  timeoutMs: number
): Promise<Device[]> {
  return new Promise((resolve, reject) => {
    if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
      reject(new Error("Invalid device connection configuration"));
      return;
    }

    if (!Number.isInteger(count) || count < 1) {
      resolve([]);
      return;
    }

    const socket = new net.Socket();
    let response = "";
    let settled = false;
    let quietTimer: ReturnType<typeof setTimeout> | undefined;
    let totalTimer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      if (quietTimer) clearTimeout(quietTimer);
      if (totalTimer) clearTimeout(totalTimer);
      socket.destroy();
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();

      try {
        resolve(parseDeviceResponse(response));
      } catch {
        reject(new Error("Unable to parse device response"));
      }
    };

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    socket.on("connect", () => {
      socket.write(JSON.stringify(
        Array.from({ length: count }, (_, index) => index + 1)
      ));
    });

    socket.on("data", (chunk) => {
      response += chunk.toString("utf8");

      if (quietTimer) clearTimeout(quietTimer);

      // Finish after the response has been quiet briefly.
      quietTimer = setTimeout(finish, 250);
    });

    socket.on("end", finish);

    socket.on("error", (error) => {
      fail(new Error(`Device connection failed: ${error.message}`));
    });

    socket.on("timeout", () => {
      if (response.length > 0) finish();
      else fail(new Error("Device connection timed out"));
    });

    socket.setTimeout(timeoutMs);

    totalTimer = setTimeout(() => {
      if (response.length > 0) finish();
      else fail(new Error("Device response timed out"));
    }, timeoutMs);

    socket.connect(port, host);
  });
}

async function readGateStatus(host: string, port: number) {
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Invalid gate connection configuration");
  }

  const ws = new WebSocket(`ws://${host}:${port}`);

  return new Promise<unknown>((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      ws.close();
      reject(new Error("Gate connection timed out"));
    }, 10000);

    ws.onopen = () => {
      ws.send(JSON.stringify([22]));
    };

    ws.onmessage = (event) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      ws.close();

      try {
        resolve(JSON.parse(String(event.data)));
      } catch {
        reject(new Error("Invalid gate response"));
      }
    };

    ws.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error("Gate connection failed"));
    };
  });
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    const plant = await getPlant(session);

    if (!plant) {
      return NextResponse.json(
        { error: "Plant configuration not found" },
        { status: 404 }
      );
    }

    const config = plant as Record<string, unknown>;

    const getString = (key: string) =>
      String(config[key] ?? "").trim();

    const getCount = (key: string) => {
      const value = Number(config[key] ?? 0);
      return Number.isSafeInteger(value) && value > 0 ? value : 0;
    };

    const host = getString("WBIP");
    const wbPort = Number(config["wbPort"]);
    const gateHost = getString("truckRegIP");
    const gatePort = Number(config["truckRegPort"]);

    const autoCount = getCount("totWbCountAuto");
    const bulkerCount = getCount("totWbCountBulker");

    const [gate, automaticWB, bulkerWB] = await Promise.all([
      readGateStatus(gateHost, gatePort)
        .then((data) => ({ data, error: null }))
        .catch((error) => ({
          data: [],
          error: error.message as string,
        })),

      autoCount > 0
        ? readTcpDevices(host, wbPort, autoCount, 15000)
            .then((data) => ({ data, error: null }))
            .catch((error) => ({
              data: [],
              error: error.message as string,
            }))
        : Promise.resolve({ data: [], error: null }),

      bulkerCount > 0
        ? readTcpDevices(host, 4477, bulkerCount, 3000)
            .then((data) => ({ data, error: null }))
            .catch((error) => ({
              data: [],
              error: error.message as string,
            }))
        : Promise.resolve({ data: [], error: null }),
    ]);

    return NextResponse.json({
      gate,
      automaticWB,
      bulkerWB,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DEVICE STATUS API]", error);

    return NextResponse.json(
      { error: "Unable to load Device Status" },
      { status: 500 }
    );
  }
}

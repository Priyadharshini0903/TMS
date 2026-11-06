
"use client";

import { useCallback, useEffect, useState } from "react";

type GateRow = {
  LOCATION?: string;
  RFIDIP?: string;
  RFIDSTATUS?: boolean | number | string | null;
  DSPIP?: string;
  DSPSTATUS?: boolean | number | string | null;
};

type Weighbridge = {
  WBID: number;
  LOCNAME: string;
};

type DeviceData = Record<string, unknown>;

type WBRow = {
  WBID: number;
  LOCNAME: string;
  data: DeviceData | null;
  error?: string;
};

function isHealthy(value: unknown): boolean | null {
  if (value === null || value === undefined || value === "") return null;

  const v = String(value).toLowerCase().trim();

  if (["1", "true", "healthy", "online", "connected"].includes(v)) {
    return true;
  }

  if (["0", "false", "unhealthy", "offline", "disconnected"].includes(v)) {
    return false;
  }

  return null;
}

function Health({ value }: { value: unknown }) {
  const healthy = isHealthy(value);

  if (healthy === null) {
    return <span className="text-gray-500">—</span>;
  }

  return (
    <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
      <span className={healthy ? "text-green-400" : "text-red-400"}>
        {healthy ? "Healthy" : "Network Issue"}
      </span>
      <span
        className={`h-4 w-4 rounded-sm ${
          healthy ? "bg-green-500" : "bg-red-500"
        }`}
      />
    </span>
  );
}

function valueOrDash(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "—";
  }

  return String(value).trim();
}

function parseControllerResponse(raw: unknown, id: number): DeviceData {
  let outer: unknown = raw;

  if (typeof outer === "string") {
    outer = JSON.parse(outer);
  }

  let inner: unknown = outer;

  if (outer && typeof outer === "object" && !Array.isArray(outer)) {
    const record = outer as Record<string, unknown>;
    inner = record[String(id)] ?? record[id] ?? outer;
  }

  if (typeof inner === "string") {
    inner = JSON.parse(inner);
  }

  if (!inner || typeof inner !== "object" || Array.isArray(inner)) {
    throw new Error("Invalid controller response");
  }

  return inner as DeviceData;
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap border border-white/10 bg-[#245f56] px-3 py-3 text-center text-xs font-bold text-white">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap border border-white/10 px-3 py-3 text-center text-sm">
      {children}
    </td>
  );
}

export default function DeviceStatus() {
  const [gateRows, setGateRows] = useState<GateRow[]>([]);
  const [gateConnection, setGateConnection] = useState<boolean | null>(null);

  const [weighbridges, setWeighbridges] = useState<WBRow[]>([]);
  const [wbConnection, setWbConnection] = useState<boolean | null>(null);

  const [wbLoading, setWbLoading] = useState(true);

  // GATE DEVICE STATUS - existing PHP equivalent, 7-second polling
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const start = Date.now();

      try {
        const response = await fetch("/api/gate-status?id=22", {
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Gate status request failed");

        const data = await response.json();

        if (!Array.isArray(data)) throw new Error("Invalid gate response");

        if (alive) {
          setGateRows(data);
          setGateConnection(true);
        }
      } catch {
        if (alive) setGateConnection(false);
      }

      if (alive) {
        timer = setTimeout(
          poll,
          Math.max(0, 7000 - (Date.now() - start))
        );
      }
    };

    void poll();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  // WEIGHBRIDGE DEVICE STATUS - reuse the existing TCP API
  const fetchWeighbridgeStatus = useCallback(async () => {
    setWbLoading(true);

    try {
      const listResponse = await fetch("/api/weighbridge/list", {
        cache: "no-store",
      });

      if (!listResponse.ok) {
        throw new Error("Unable to load weighbridge list");
      }

      const list: Weighbridge[] = await listResponse.json();

      const results = await Promise.all(
        list.map(async (wb) => {
          try {
            const response = await fetch(
              `/api/weighbridge/status?id=${wb.WBID}`,
              { cache: "no-store" }
            );

            const raw = await response.text();

            if (!response.ok) {
              let message = "Controller unavailable";

              try {
                message = JSON.parse(raw).message ?? message;
              } catch {
                // Keep fallback message.
              }

              throw new Error(message);
            }

            const data = parseControllerResponse(raw, wb.WBID);

            return {
              WBID: wb.WBID,
              LOCNAME: wb.LOCNAME,
              data,
            };
          } catch (error) {
            return {
              WBID: wb.WBID,
              LOCNAME: wb.LOCNAME,
              data: null,
              error:
                error instanceof Error
                  ? error.message
                  : "Unable to read controller",
            };
          }
        })
      );

      setWeighbridges(results);

      setWbConnection(
        results.length > 0 && results.some((row) => row.data !== null)
      );
    } catch (error) {
      console.error("Device status error:", error);
      setWbConnection(false);
      setWeighbridges([]);
    } finally {
      setWbLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      await fetchWeighbridgeStatus();

      if (alive) {
        timer = setTimeout(poll, 7000);
      }
    };

    void poll();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [fetchWeighbridgeStatus]);

  return (
    <main className="min-w-0 space-y-6 p-4">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold italic text-accent">
          DEVICE STATUS
        </h1>

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span
            className={`rounded px-3 py-2 ${
              gateConnection === null
                ? "bg-white/10 text-gray-400"
                : gateConnection
                ? "bg-green-500/15 text-green-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            Gate: {gateConnection === null ? "Connecting..." : gateConnection ? "Connected" : "Disconnected"}
          </span>

          <span
            className={`rounded px-3 py-2 ${
              wbConnection === null
                ? "bg-white/10 text-gray-400"
                : wbConnection
                ? "bg-green-500/15 text-green-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            Weighbridge: {wbLoading && wbConnection === null ? "Connecting..." : wbConnection ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* GATE DEVICE STATUS */}
      <section className="card overflow-hidden rounded-xl border border-teal/40">
        <h2 className="border-b border-teal/30 bg-[#202624] px-4 py-3 font-bold text-accent">
          Gate Device Status
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead>
              <tr>
                <TableHeader>Sno</TableHeader>
                <TableHeader>Location</TableHeader>
                <TableHeader>Reader IP</TableHeader>
                <TableHeader>Reader Status</TableHeader>
                <TableHeader>Display IP</TableHeader>
                <TableHeader>Display Status</TableHeader>
              </tr>
            </thead>

            <tbody>
              {gateRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-5 text-center text-muted">
                    {gateConnection === false
                      ? "Unable to retrieve gate device information."
                      : "Loading gate devices..."}
                  </td>
                </tr>
              ) : (
                gateRows.map((row, index) => (
                  <tr
                    key={`${row.LOCATION ?? "gate"}-${index}`}
                    className="border-t border-white/10 hover:bg-white/5"
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{valueOrDash(row.LOCATION)}</TableCell>
                    <TableCell>{valueOrDash(row.RFIDIP)}</TableCell>
                    <TableCell><Health value={row.RFIDSTATUS} /></TableCell>
                    <TableCell>{valueOrDash(row.DSPIP)}</TableCell>
                    <TableCell><Health value={row.DSPSTATUS} /></TableCell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* WEIGHBRIDGE DEVICE STATUS */}
      <section className="card overflow-hidden rounded-xl border border-teal/40">
        <h2 className="border-b border-teal/30 bg-[#202624] px-4 py-3 font-bold text-accent">
          Weighbridge Device Status
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1900px] border-collapse">
            <thead>
              <tr>
                <TableHeader>Sno</TableHeader>
                <TableHeader>Location</TableHeader>
                <TableHeader>Reader-1 IP</TableHeader>
                <TableHeader>Reader-1 Status</TableHeader>
                <TableHeader>Reader-2 IP</TableHeader>
                <TableHeader>Reader-2 Status</TableHeader>
                <TableHeader>Display-1 IP</TableHeader>
                <TableHeader>Display-1 Status</TableHeader>
                <TableHeader>Display-2 IP</TableHeader>
                <TableHeader>Display-2 Status</TableHeader>
                <TableHeader>WB Indicator IP</TableHeader>
                <TableHeader>WB Indicator Status</TableHeader>
                <TableHeader>WB Controller IP</TableHeader>
                <TableHeader>WB Controller Status</TableHeader>
              </tr>
            </thead>

            <tbody>
              {wbLoading && weighbridges.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-5 text-center text-muted">
                    Loading weighbridge devices...
                  </td>
                </tr>
              ) : weighbridges.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-5 text-center text-muted">
                    No weighbridges configured for this plant.
                  </td>
                </tr>
              ) : (
                weighbridges.map((wb, index) => {
                  const d = wb.data;

                  return (
                    <tr
                      key={wb.WBID}
                      className="border-t border-white/10 hover:bg-white/5"
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{wb.LOCNAME}</TableCell>

                      <TableCell>{valueOrDash(d?.RFID1IP)}</TableCell>
                      <TableCell><Health value={d?.RF1STAT} /></TableCell>

                      <TableCell>{valueOrDash(d?.RFID2IP)}</TableCell>
                      <TableCell><Health value={d?.RF2STAT} /></TableCell>

                      <TableCell>{valueOrDash(d?.WB1DSPIP)}</TableCell>
                      <TableCell><Health value={d?.WB1DSPSTAT} /></TableCell>

                      <TableCell>
                        {valueOrDash(d?.WB2DSPIP ?? d?.["WB2DSPIP  "])}
                      </TableCell>
                      <TableCell><Health value={d?.WB2DSPSTAT} /></TableCell>

                      <TableCell>{valueOrDash(d?.WBINDIP)}</TableCell>
                      <TableCell><Health value={d?.WBINDSTAT} /></TableCell>

                      <TableCell>{valueOrDash(d?.WBCTRIP)}</TableCell>
                      <TableCell><Health value={d?.WBCTRSTAT} /></TableCell>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

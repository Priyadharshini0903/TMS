
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

  if (["1", "true", "healthy", "online", "connected"].includes(v)) return true;
  if (["0", "false", "unhealthy", "offline", "disconnected"].includes(v)) return false;

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
      <span className={`h-3 w-3 rounded-sm ${healthy ? "bg-green-500" : "bg-red-500"}`} />
    </span>
  );
}

function ConnectionBadge({
  label,
  connected,
}: {
  label: string;
  connected: boolean | null;
}) {
  const styles =
    connected === null
      ? "border-white/10 bg-white/5 text-gray-400"
      : connected
        ? "border-green-500/30 bg-green-500/10 text-green-400"
        : "border-red-500/30 bg-red-500/10 text-red-400";

  return (
    <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${styles}`}>
      <span className={`h-2 w-2 rounded-full ${
        connected === null
          ? "bg-gray-500 animate-pulse"
          : connected
            ? "bg-green-500"
            : "bg-red-500"
      }`} />
      {label}: {connected === null ? "Connecting..." : connected ? "Connected" : "Disconnected"}
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

  if (typeof outer === "string") outer = JSON.parse(outer);

  let inner: unknown = outer;

  if (outer && typeof outer === "object" && !Array.isArray(outer)) {
    const record = outer as Record<string, unknown>;
    inner = record[String(id)] ?? record[id] ?? outer;
  }

  if (typeof inner === "string") inner = JSON.parse(inner);

  if (!inner || typeof inner !== "object" || Array.isArray(inner)) {
    throw new Error("Invalid controller response");
  }

  return inner as DeviceData;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-teal/30 bg-[#202624] px-4 py-3">
      <h2 className="font-bold text-accent">{children}</h2>
    </div>
  );
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

function EmptyRow({
  columns,
  title,
  description,
  disconnected = false,
}: {
  columns: number;
  title: string;
  description?: string;
  disconnected?: boolean;
}) {
  return (
    <tr>
      <td colSpan={columns} className="px-4 py-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className={`text-sm font-semibold ${disconnected ? "text-red-400" : "text-gray-400"}`}>
            {title}
          </span>
          {description && (
            <span className="text-xs text-gray-500">{description}</span>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function DeviceStatus() {
  const [gateRows, setGateRows] = useState<GateRow[]>([]);
  const [gateConnection, setGateConnection] = useState<boolean | null>(null);

  const [weighbridges, setWeighbridges] = useState<WBRow[]>([]);
  const [wbConnection, setWbConnection] = useState<boolean | null>(null);
  const [wbLoading, setWbLoading] = useState(true);

  // GATE STATUS
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
              console.log("GATE STATUS API RESPONSE:", data);

              setGateRows(data);
              setGateConnection(data.length > 0);
            }
      } catch {
        if (alive) setGateConnection(false);
      }

      if (alive) {
        timer = setTimeout(poll, Math.max(0, 7000 - (Date.now() - start)));
      }
    };

    void poll();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  // WEIGHBRIDGE STATUS
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
                // Use fallback message.
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

      if (alive) timer = setTimeout(poll, 7000);
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold italic tracking-wide text-accent">
            DEVICE STATUS
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Live monitoring of gate and weighbridge devices
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ConnectionBadge label="Gate" connected={gateConnection} />
          <ConnectionBadge label="Weighbridge" connected={wbConnection} />
        </div>
      </div>

      {/* GATE DEVICE STATUS */}
      <section className="card overflow-hidden rounded-xl border border-teal/40 shadow-lg shadow-black/20">
        <SectionHeader>Gate Device Status</SectionHeader>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse">
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
  <EmptyRow
    columns={6}
    title={
      gateConnection === null
        ? "Loading gate devices..."
        : gateConnection === false
          ? "No gate device records received"
          : "No gate devices configured"
    }
    disconnected={gateConnection === false}
  />
) : (
  gateRows.map((row, index) => (
    // Keep your existing row JSX here

                  <tr
                    key={`${row.LOCATION ?? "gate"}-${index}`}
                    className="border-t border-white/10 transition-colors hover:bg-teal/5"
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
      <section className="card overflow-hidden rounded-xl border border-teal/40 shadow-lg shadow-black/20">
        <SectionHeader>Weighbridge Device Status</SectionHeader>

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
                <EmptyRow columns={14} title="Loading weighbridge devices..." />
              ) : weighbridges.length === 0 ? (
                <EmptyRow
                  columns={14}
                  title={
                    wbConnection === false
                      ? "Unable to connect to weighbridge server"
                      : "No weighbridges configured for this plant"
                  }
                  description={
                    wbConnection === false
                      ? "Connection failed. Waiting for the next retry."
                      : undefined
                  }
                  disconnected={wbConnection === false}
                />
              ) : (
                weighbridges.map((wb, index) => {
                  const d = wb.data;

                  return (
                    <tr
                      key={wb.WBID}
                      className="border-t border-white/10 transition-colors hover:bg-teal/5"
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{wb.LOCNAME}</TableCell>

                      {d ? (
                        <>
                          <TableCell>{valueOrDash(d.RFID1IP)}</TableCell>
                          <TableCell><Health value={d.RF1STAT} /></TableCell>

                          <TableCell>{valueOrDash(d.RFID2IP)}</TableCell>
                          <TableCell><Health value={d.RF2STAT} /></TableCell>

                          <TableCell>{valueOrDash(d.WB1DSPIP)}</TableCell>
                          <TableCell><Health value={d.WB1DSPSTAT} /></TableCell>

                          <TableCell>
                            {valueOrDash(d.WB2DSPIP ?? d["WB2DSPIP  "])}
                          </TableCell>
                          <TableCell><Health value={d.WB2DSPSTAT} /></TableCell>

                          <TableCell>{valueOrDash(d.WBINDIP)}</TableCell>
                          <TableCell><Health value={d.WBINDSTAT} /></TableCell>

                          <TableCell>{valueOrDash(d.WBCTRIP)}</TableCell>
                          <TableCell><Health value={d.WBCTRSTAT} /></TableCell>
                        </>
                      ) : (
                        <td colSpan={12} className="border border-white/10 px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-red-400">
                            Connection failed
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {wb.error ?? "No response from controller"}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* BULKER DEVICE STATUS
          UI section only. Connect it to Bulker data when its API is ready. */}
    </main>
  );
}


"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type GateDevice = {
  LOCATION?: string;
  LOCSTR?: string;
  RFIDIP?: string;
  RFIDSTATUS?: boolean | string;
  DSPIP?: string;
  DSPSTATUS?: boolean | string;
};

type WBDevice = {
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

type Section<T> = {
  data: T[];
  error: string | null;
};

type StatusResponse = {
  gate: Section<GateDevice>;
  automaticWB: Section<WBDevice>;
  bulkerWB: Section<WBDevice>;
  updatedAt: string;
};

function isHealthy(value: boolean | string | undefined) {
  return value === true || value === "true";
}

function StatusIndicator({ value }: { value: boolean | string | undefined }) {
  const healthy = isHealthy(value);

  return (
    <span
      title={healthy ? "Healthy" : "Network Issue"}
      className={`inline-block h-5 w-5 rounded-md ${
        healthy ? "bg-green-500" : "bg-red-500"
      }`}
    />
  );
}

function StatusMessage({ error }: { error: string | null }) {
  if (!error) return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {error}
    </div>
  );
}


function TableContainer({
  title,
  children,
  error,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  error: string | null;
  empty: boolean;
}) {
  return (
    <section className="mb-6 overflow-hidden border border-gray-300 bg-white">
      <div className="border-b border-gray-300 bg-gray-100 px-4 py-3">
        <h2 className="text-base font-semibold text-gray-800">
          {title}
        </h2>
      </div>

      <div className="overflow-x-auto">
        {children}

        {empty && (
          <div className="border-t border-gray-200 px-4 py-5 text-center text-sm text-gray-600">
            {error
              ? "Unable to retrieve device status."
              : "No data available."}
          </div>
        )}

        {error && (
          <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
      </div>
    </section>
  );
} 
 
function StatusTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <table className="w-full min-w-max border-collapse text-sm">
      <thead className="bg-[#0E5EAD] text-center text-white">
        <tr>
          {headers.map((header) => (
            <th key={header} className="border border-blue-300 px-4 py-3 font-medium">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function WBTable({ devices }: { devices: WBDevice[] }) {
  const headers = [
    "Sno",
    "Location",
    "Reader-1 IP",
    "Reader-1 Status",
    "Reader-2 IP",
    "Reader-2 Status",
    "Display-1 IP",
    "Display-1 Status",
    "Display-2 IP",
    "Display-2 Status",
    "WB Indicator IP",
    "WB Indicator Status",
    "WB Controller IP",
    "WB Controller Status",
  ];

  const rows = [
    ["RFID1IP", "RF1STAT"],
    ["RFID2IP", "RF2STAT"],
    ["WB1DSPIP", "WB1DSPSTAT"],
    ["WB2DSPIP", "WB2DSPSTAT"],
    ["WBINDIP", "WBINDSTAT"],
    ["WBCTRIP", "WBCTRSTAT"],
  ] as const;

  return (
    <StatusTable headers={headers}>
      {devices.map((device, index) => (
        <tr key={index} className="text-center font-medium text-gray-700 hover:bg-gray-50">
          <td className="border px-3 py-3">{index + 1}</td>
          <td className="border px-3 py-3 text-left">{device.LOCNAME || "-"}</td>

          {rows.map(([ipKey, statusKey]) => (
            <React.Fragment key={ipKey}>
              <td className="border px-3 py-3 text-left">
                {device[ipKey] || "-"}
              </td>
              <td className="border px-3 py-3">
                <StatusIndicator value={device[statusKey]} />
              </td>
            </React.Fragment>
          ))}
        </tr>
      ))}
    </StatusTable>
  );
}

function GateTable({ devices }: { devices: GateDevice[] }) {
  return (
    <StatusTable
      headers={[
        "Sno",
        "Location",
        "Reader IP",
        "Reader Status",
        "Display IP",
        "Display Status",
      ]}
    >
      {devices.map((device, index) => (
        <tr key={index} className="text-center font-medium text-gray-700 hover:bg-gray-50">
          <td className="border px-3 py-3">{index + 1}</td>
          <td className="border px-3 py-3 text-left">
            {device.LOCATION || device.LOCSTR || "-"}
          </td>
          <td className="border px-3 py-3 text-left">{device.RFIDIP || "-"}</td>
          <td className="border px-3 py-3">
            <StatusIndicator value={device.RFIDSTATUS} />
          </td>
          <td className="border px-3 py-3 text-left">{device.DSPIP || "-"}</td>
          <td className="border px-3 py-3">
            <StatusIndicator value={device.DSPSTATUS} />
          </td>
        </tr>
      ))}
    </StatusTable>
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

export default function DeviceStatusPage() {
  const [result, setResult] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [pageError, setPageError] = useState("");

  const activeController = useRef<AbortController | null>(null);

  const fetchStatus = useCallback(async (signal: AbortSignal) => {
    const response = await fetch("/api/device-status", {
      method: "GET",
      cache: "no-store",
      signal,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load Device Status");
    }

    return data as StatusResponse;
  }, []);

  const [weighbridges, setWeighbridges] = useState<WBRow[]>([]);
  const [wbConnection, setWbConnection] = useState<boolean | null>(null);

  const [wbLoading, setWbLoading] = useState(true);

  // GATE DEVICE STATUS - existing PHP equivalent, 7-second polling
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;

    const schedule = (delay: number) => {
      if (stopped || document.hidden) return;
      timer = setTimeout(run, delay);
    };

    const run = async () => {
      if (stopped || document.hidden) return;

      const controller = new AbortController();
      activeController.current = controller;

      try {
        const data = await fetchStatus(controller.signal);

        if (stopped) return;

        setResult(data);
        setLastUpdated(new Date().toLocaleTimeString());
        setPageError("");
        failures = 0;
      } catch (error) {
        if (stopped || controller.signal.aborted) return;

        failures += 1;
        setPageError(
          error instanceof Error ? error.message : "Unable to load Device Status"
        );
      } finally {
        if (activeController.current === controller) {
          activeController.current = null;
        }

        if (!stopped && !document.hidden) {
          const delay =
            failures === 0
              ? 7000
              : Math.min(5000 * 2 ** (failures - 1), 30000);

          schedule(delay);
        }
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (timer) clearTimeout(timer);
        activeController.current?.abort();
      } else {
        if (timer) clearTimeout(timer);
        run();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    run();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      activeController.current?.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchStatus]);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Device Status</h1>
          <p className="mt-1 text-sm text-gray-500">
            Live connectivity status of plant devices
          </p>
        </div>

        <div className="text-right text-xs text-gray-500">
          <div className="flex items-center justify-end gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Auto refresh enabled
          </div>
          <p className="mt-1">
            Last updated: {lastUpdated || "Waiting..."}
          </p>
        </div>
      </div>

      {pageError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {pageError}
        </div>
      )}

      {loading && !result ? (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
          Loading device status...
        </div>
      ) : result ? (
        <>
          <TableContainer
            title="Gate Devices"
            error={result.gate.error}
            empty={result.gate.data.length === 0}
          >
            <GateTable devices={result.gate.data} />
          </TableContainer>

          <TableContainer
            title="Automatic Weighbridge Devices"
            error={result.automaticWB.error}
            empty={result.automaticWB.data.length === 0}
          >
            <WBTable devices={result.automaticWB.data} />
          </TableContainer>

          <TableContainer
            title="Bulker Weighbridge Devices"
            error={result.bulkerWB.error}
            empty={result.bulkerWB.data.length === 0}
          >
            <WBTable devices={result.bulkerWB.data} />
          </TableContainer>
        </>
      ) : (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
          Unable to retrieve device information.
        </div>
      )}
    </div>
  );
}

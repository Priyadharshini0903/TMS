
"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

type BulkerData = {
  WB1WT?: string | number;
  RFNO?: string;
  TRKNO?: string;
  CURSTATUS?: string;
  TCPCNT?: string | number;
  CLRCNT?: string | number;
  RFCURTAG?: string;
  DOWT?: string | number;
  TAREWT?: string | number;
  TGTWT?: string | number;
  FSTRLWT?: string | number;
  SNDRLWT?: string | number;
  TRDRLWT?: string | number;
  NETWT?: string | number;
  GROSSWT?: string | number;
  WBCTRSTAT?: boolean | number | string;
  IN1STAT?: boolean | number | string;
  IN2STAT?: boolean | number | string;
  IN3STAT?: boolean | number | string;
  IN4STAT?: boolean | number | string;
  IN5STAT?: boolean | number | string;
  IN6STAT?: boolean | number | string;
  IN7STAT?: boolean | number | string;
  IN8STAT?: boolean | number | string;
  OUT1STAT?: boolean | number | string;
  OUT2STAT?: boolean | number | string;
  OUT3STAT?: boolean | number | string;
  OUT4STAT?: boolean | number | string;
  OUT5STAT?: boolean | number | string;
  OUT6STAT?: boolean | number | string;
  OUT7STAT?: boolean | number | string;
  OUT8STAT?: boolean | number | string;
};

type RecordItem = {
  RFNO?: string;
  TRUCKNO?: string;
  WEIGHT?: string | number;
  STATUS?: string;
  DatTim?: string;
};

const weightRows = [
  { label: "DO QTY", key: "DOWT", color: "text-cyan-300" },
  { label: "TARE WEIGHT", key: "TAREWT", color: "text-emerald-400" },
  { label: "TARGET WEIGHT", key: "TGTWT", color: "text-red-400" },
  { label: "STAGE 1", key: "FSTRLWT", color: "text-red-400" },
  { label: "STAGE 2", key: "SNDRLWT", color: "text-red-400" },
  { label: "LOAD COMPLETE AT", key: "TRDRLWT", color: "text-red-400" },
  { label: "NET WEIGHT", key: "NETWT", color: "text-cyan-300" },
  { label: "GROSS WEIGHT", key: "GROSSWT", color: "text-emerald-400" },
];

const inputRows = [
  { label: "POSITION SENSOR INPUT", key: "IN1STAT" },
  { label: "INPUT 2", key: "IN2STAT" },
  { label: "INPUT 3", key: "IN3STAT" },
  { label: "EMERGENCY INPUT", key: "IN4STAT" },
  { label: "INPUT 5", key: "IN5STAT" },
  { label: "LOADING START", key: "IN6STAT" },
  { label: "TARE WEIGHT", key: "IN7STAT" },
  { label: "GROSS WEIGHT", key: "IN8STAT" },
];

const outputRows = [
  { label: "1st STAGE COMPLETED", key: "OUT1STAT" },
  { label: "2nd STAGE COMPLETED", key: "OUT2STAT" },
  { label: "LOADING COMPLETED", key: "OUT3STAT" },
  { label: "EMERGENCY STOP", key: "OUT4STAT" },
  { label: "BUZZER", key: "OUT5STAT" },
  { label: "LOADING START", key: "OUT6STAT" },
  { label: "TARE WEIGHT", key: "OUT7STAT" },
  { label: "GROSS WEIGHT", key: "OUT8STAT" },
];

function parseControllerResponse(
  response: string,
  id: number,
): BulkerData {
  let parsed: any = JSON.parse(response);

  // The controller response may contain JSON inside another JSON string.
  if (typeof parsed === "string") {
    parsed = JSON.parse(parsed);
  }

  const bulkerData = parsed[String(id)] ?? parsed[id];

  if (!bulkerData) {
    throw new Error("Bulker data not found in controller response.");
  }

  return typeof bulkerData === "string"
    ? JSON.parse(bulkerData)
    : bulkerData;
}

function isActive(value: unknown) {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block h-4 w-4 rounded-full border ${
        active
          ? "border-emerald-300 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
          : "border-gray-600 bg-gray-800"
      }`}
    />
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#CBD5E1] bg-[#FFFFFF]">
      <div className="border-b border-[#CBD5E1] px-4 py-3">
        <h2 className="text-center text-sm font-bold tracking-wide text-[#0E7490]">
          {title}
        </h2>
      </div>

      <div className="p-2">{children}</div>
    </section>
  );
}

export default function BulkerPage() {
  const [bulkerId] = useState(1);

  const [data, setData] = useState<BulkerData>({});
  const [connectionError, setConnectionError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const [modal, setModal] = useState<"records" | "settings" | null>(null);

  const [records, setRecords] = useState<RecordItem[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");

  // Fetch live Bulker controller status.
  const getBulkerStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/bulker/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: bulkerId }),
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to connect to Bulker.",
        );
      }

      const parsedData = parseControllerResponse(
        result.response,
        bulkerId,
      );

      setData(parsedData);
      setConnectionError("");
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      setConnectionError(
        error instanceof Error
          ? error.message
          : "Bulker connection failed.",
      );
    }
  }, [bulkerId]);

  // Poll controller every 2 seconds.
  useEffect(() => {
    getBulkerStatus();

    const interval = setInterval(() => {
      getBulkerStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [getBulkerStatus]);

  // Fetch last 60 Bulker records.
  async function getLastRecords() {
    setModal("records");
    setRecordsLoading(true);
    setRecordsError("");
    setRecords([]);

    try {
      const response = await fetch("/api/bulker/last-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: bulkerId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to load records.",
        );
      }

      setRecords(result.records ?? []);
    } catch (error) {
      setRecordsError(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setRecordsLoading(false);
    }
  }

  const value = (key: string) =>
    data[key as keyof BulkerData] ?? 0;

  return (
    <div className="h-[calc(100vh-48px)] overflow-hidden bg-[#F8FAFC] p-3 text-[#0E7490]">

      {/* Page heading and menu */}
      <div className="mb-3 space-y-2">
        <h1 className="text-base font-semibold text-[#0E7490]">
          Bulker(s)
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-md bg-[#0E7490] px-4 py-2 text-sm font-semibold text-white"
          >
            BULKER {bulkerId}
          </button>

          <button
            onClick={() => setModal("settings")}
            className="rounded-md bg-[#F1F5F9] px-4 py-2 text-sm text-slate-700 transition hover:bg-[#E2E8F0]"
          >
            SETTINGS
          </button>
        </div>
      </div>

      {/* Main Bulker panel */}
      <div className="overflow-hidden rounded-xl border border-[#CBD5E1] bg-[#FFFFFF]">

        {/* RFID, Truck and Bulker header */}
        <div className="grid grid-cols-1 items-center gap-3 border-b border-[#CBD5E1] p-2 lg:grid-cols-12">

          <div className="lg:col-span-2">
            <button
              onClick={getLastRecords}
              className="w-full rounded-md bg-[#0E7490] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0891B2]"
            >
              ☷ Show Last 60 Records
            </button>
          </div>

          <div className="lg:col-span-4">
            <input
              readOnly
              value={data.RFNO ?? ""}
              placeholder="RFID No."
              className="w-full rounded-md border border-[#CBD5E1] bg-[#F1F5F9] px-3 py-3 text-center text-lg text-[#0E7490] outline-none placeholder:text-gray-400"
            />
          </div>

          <div className="lg:col-span-4">
            <input
              readOnly
              value={data.TRKNO ?? ""}
              placeholder="Truck No."
              className="w-full rounded-md border border-[#CBD5E1] bg-[#F1F5F9] px-3 py-3 text-center text-lg text-[#0E7490] outline-none placeholder:text-gray-400"
            />
          </div>

          <div className="text-center lg:col-span-2">
            <p className="text-2xl font-bold text-[#0E7490]">
              Bulker - {bulkerId}
            </p>
          </div>
        </div>

        {/* Compact PLC, TMS, CLR and Load Cell row */}
        <div className="flex flex-wrap items-center gap-4 border-b border-[#CBD5E1] px-4 py-4">

          {/* PLC */}
          <div
            className={`rounded-md px-4 py-2 font-bold text-black ${
              isActive(data.WBCTRSTAT)
                ? "bg-emerald-400"
                : "bg-red-500"
            }`}
          >
            PLC
          </div>

          {/* TMS count */}
          <div className="flex items-center gap-2">
            {/* <span className="text-sm text-gray-400">TMS</span> */}
            <input
              readOnly
              value={data.TCPCNT ?? 0}
              className="w-20 rounded-md border border-[#CBD5E1] bg-[#F1F5F9] p-2 text-center text-lg text-[#0E7490] outline-none"
            />
          </div>

          {/* CLR count */}
          <div className="flex items-center gap-2">
            {/* <span className="text-sm text-gray-400">CLR</span> */}
            <input
              readOnly
              value={data.CLRCNT ?? 0}
              className="w-20 rounded-md border border-[#CBD5E1] bg-[#F1F5F9] p-2 text-center text-lg text-[#0E7490] outline-none"
            />
          </div>

          {/* Load cell */}
          <div className="ml-auto min-w-48 rounded-md bg-black px-5 py-2 text-center">
            <span className="text-3xl font-bold text-red-500">
              {data.WB1WT ?? "00000"}
            </span>
          </div>
        </div>

        {/* Weight, Inputs and Outputs */}
        <div className="grid grid-cols-1 gap-3 bg-[#F1F5F9] p-2 xl:grid-cols-12">

          {/* Weight details */}
          <div className="xl:col-span-4">
            <Panel title="WEIGHT DETAILS">
              <div className="flex min-h-[390px] items-center justify-center">
                <table className="w-full max-w-lg border-collapse text-sm">
                  <tbody>
                    {weightRows.map((row) => (
                      <tr
                        key={row.key}
                        className="border-b border-[#CBD5E1] even:bg-[#F1F5F9]"
                      >
                        <td className="px-2 py-1.5 text-xs font-semibold text-gray-300">
                          {row.label}
                        </td>

                        <td
                          className={`px-2 py-1.5 text-right text-sm font-bold ${row.color}`}
                        >
                          {value(row.key)} Tonnes
                        </td>
                      </tr>
                    ))}

                    <tr className="bg-[#F1F5F9]">
                      <td className="px-3 py-3 font-semibold text-gray-300">
                        CURRENT RFNO
                      </td>

                      <td className="break-all px-3 py-3 text-right font-bold text-[#0E7490]">
                        {data.RFCURTAG ?? ""}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          {/* Inputs */}
          <div className="xl:col-span-4">
            <Panel title="INPUTS">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#CBD5E1] text-[#0E7490]">
                    <th className="px-2 py-1.5 text-left">INPUTS</th>
                    <th className="px-2 py-3 text-center">STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {inputRows.map((row) => (
                    <tr
                      key={row.key}
                      className="border-b border-[#CBD5E1] even:bg-[#F1F5F9]"
                    >
                      <td className="px-2 py-3 text-gray-300">
                        {row.label}
                      </td>

                      <td className="px-2 py-2 text-center">
                        <StatusDot
                          active={isActive(
                            data[row.key as keyof BulkerData],
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Current status */}
              <div className="mt-2 rounded-lg border border-[#CBD5E1] bg-black px-3 py-2">
                <p className="mb-2 text-xs text-gray-500">
                  CURRENT STATUS
                </p>

                <p className="text-sm text-[#53e5d0]">
                  {data.CURSTATUS ||
                    "Waiting for controller status..."}
                </p>
              </div>
            </Panel>
          </div>

          {/* Outputs */}
          <div className="xl:col-span-4">
            <Panel title="OUTPUTS">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#CBD5E1] text-[#0E7490]">
                    <th className="px-2 py-1.5 text-left">OUTPUTS</th>
                    <th className="px-2 py-3 text-center">STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {outputRows.map((row) => (
                    <tr
                      key={row.key}
                      className="border-b border-[#CBD5E1] even:bg-[#F1F5F9]"
                    >
                      <td className="px-2 py-3 text-gray-300">
                        {row.label}
                      </td>

                      <td className="px-2 py-2 text-center">
                        <StatusDot
                          active={isActive(
                            data[row.key as keyof BulkerData],
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
        </div>
      </div>

      {/* Connection information */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] px-4 py-3 text-sm">
        <span
          className={
            connectionError ? "text-red-400" : "text-emerald-400"
          }
        >
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-current" />
          {connectionError || "Waiting for controller status..."}
        </span>

        {lastUpdated && (
          <span className="text-gray-400">
            Last updated: {lastUpdated}
          </span>
        )}
      </div>

      {/* Last 60 Records modal */}
      {modal === "records" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-6xl overflow-hidden rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] shadow-2xl">

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CBD5E1] px-5 py-4">
              <h2 className="text-lg font-bold text-[#0E7490]">
                LAST 60 RECORDS
              </h2>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">
                  {records.length} of 60 Records
                </span>

                <button
                  onClick={() => setModal(null)}
                  className="text-2xl text-gray-300 hover:text-red-400"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-auto p-4">
              {recordsLoading ? (
                <p className="py-10 text-center text-[#0E7490]">
                  Loading records...
                </p>
              ) : recordsError ? (
                <p className="py-10 text-center text-red-400">
                  {recordsError}
                </p>
              ) : (
                <>
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-[#FFFFFF] text-[#0E7490]">
                      <tr>
                        {[
                          "Sno",
                          "RFID No",
                          "Truck No",
                          "Weight",
                          "Status",
                          "Timestamp",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="border-b border-[#CBD5E1] px-3 py-3 text-left"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {records.map((record, index) => (
                        <tr
                          key={index}
                          className="border-b border-[#CBD5E1] even:bg-[#F1F5F9] hover:bg-[#E0F2FE]"
                        >
                          <td className="px-3 py-3 text-center text-gray-300">
                            {index + 1}
                          </td>

                          <td className="break-all px-3 py-3 text-[#0E7490]">
                            {record.RFNO}
                          </td>

                          <td className="px-3 py-3 text-gray-300">
                            {record.TRUCKNO}
                          </td>

                          <td className="px-3 py-3 text-gray-300">
                            {record.WEIGHT}
                          </td>

                          <td className="px-3 py-3 text-gray-300">
                            {record.STATUS}
                          </td>

                          <td className="px-3 py-3 text-gray-300">
                            {record.DatTim}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {records.length === 0 && (
                    <p className="py-8 text-center text-gray-400">
                      No records found.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-[#CBD5E1] p-3 text-right">
              <button
                onClick={() => setModal(null)}
                className="rounded-md bg-[#0E7490] px-5 py-2 font-semibold text-white hover:bg-[#0891B2]"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings placeholder */}
      {modal === "settings" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#CBD5E1] px-5 py-4">
              <h2 className="font-bold text-[#0E7490]">
                BULKER SETTINGS
              </h2>

              <button
                onClick={() => setModal(null)}
                className="text-2xl text-gray-300 hover:text-red-400"
              >
                ×
              </button>
            </div>

            <div className="p-5 text-sm text-gray-400">
              The original Bulker settings screen and API will be connected next.
            </div>

            <div className="border-t border-[#CBD5E1] p-3 text-right">
              <button
                onClick={() => setModal(null)}
                className="rounded-md bg-[#0E7490] px-5 py-2 font-semibold text-white hover:bg-[#0891B2]"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

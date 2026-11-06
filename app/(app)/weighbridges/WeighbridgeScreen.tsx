"use client";

import { useEffect, useState } from "react";

type Weighbridge = {
  WBID: number;
  LOCNAME?: string;
  [key: string]: unknown;
};

type LiveData = Record<string, unknown>;
type Device = { name: string; ip: string; status: unknown };

function isOn(value: unknown) {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value).toLowerCase() === "true"
  );
}

function display(value: unknown, fallback = "—") {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }
  return String(value).trim();
}

function parseControllerResponse(raw: string, id: number): LiveData {
  const outer: unknown = JSON.parse(raw);
  let inner: unknown = outer;

  if (outer && typeof outer === "object" && !Array.isArray(outer)) {
    const record = outer as Record<string, unknown>;
    inner = record[String(id)] ?? record[id] ?? outer;
  }

  if (typeof inner === "string") inner = JSON.parse(inner);

  if (!inner || typeof inner !== "object" || Array.isArray(inner)) {
    throw new Error("Unexpected response format from weighbridge controller");
  }

  return inner as LiveData;
}


function Signal({ green }: { green: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-sm border border-gray-300 bg-white p-1.5 shadow-md">
      <span
        className={`h-5 w-5 rounded-full border border-gray-400 ${
          green ? "bg-[#555]" : "bg-red-600"
        }`}
      />
      <span
        className={`h-5 w-5 rounded-full border border-gray-400 ${
          green ? "bg-green-500" : "bg-[#777]"
        }`}
      />
    </div>
  );
}


function Sensor({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow ${
        active ? "bg-green-500" : "bg-red-600"
      }`}
    >
      {label}
    </div>
  );
}


function DeviceStatus({ live }: { live: LiveData }) {
  const devices: Device[] = [
    {
      name: "Reader 1",
      ip: display(live.RFID1IP, ""),
      status: live.RF1STAT,
    },
    {
      name: "Reader 2",
      ip: display(live.RFID2IP, ""),
      status: live.RF2STAT,
    },
    {
      name: "Display 1",
      ip: display(live.WB1DSPIP, ""),
      status: live.WB1DSPSTAT,
    },
    {
      name: "Display 2",
      ip: display(live["WB2DSPIP"] ?? live["WB2DSPIP  "], ""),
      status: live.WB2DSPSTAT,
    },
    {
      name: "WB Indicator",
      ip: display(live.WBINDIP, ""),
      status: live.WBINDSTAT,
    },
    {
      name: "WB Controller",
      ip: display(live.WBCTRIP, ""),
      status: live.WBCTRSTAT,
    },
  ];

  // Match PHP: hide both rows when the device IP is empty.
  const availableDevices = devices.filter((device) => device.ip !== "");

  return (
    <div className="h-fit self-start overflow-hidden rounded-xl border border-teal/30 bg-[#171a19]">
      {/* HEADER */}
      <div className="bg-[#245f56] px-3 py-3 text-center font-bold text-white">
        Device Status
      </div>

      {availableDevices.length === 0 ? (
        <div className="p-5 text-center text-sm text-muted">
          Device information is not available.
        </div>
      ) : (
        <div>
          {availableDevices.map((device) => {
            const healthy = isOn(device.status);

            return (
              <div key={device.name} className="border-t border-white/10">
                {/* IP ADDRESS */}
                <div className="grid grid-cols-[42%_58%]">
                  <div className="border-r border-white/10 px-3 py-3 text-sm font-semibold text-muted">
                    {device.name} IP
                  </div>

                  <div className="break-all px-3 py-3 text-center text-sm font-semibold text-accent">
                    {device.ip}
                  </div>
                </div>

                {/* DEVICE STATUS */}
                <div className="grid grid-cols-[42%_58%] border-t border-white/10">
                  <div className="border-r border-white/10 px-3 py-3 text-sm font-semibold text-muted">
                    {device.name} Status
                  </div>

                  <div
                    className={`px-3 py-3 text-center text-sm font-semibold ${
                      healthy ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {healthy ? "Healthy" : "Network Issue"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

  

// LAST 60 RECORDS POPUP
function LastRecordsModal({
  wbId,
  onClose,
}: {
  wbId: number;
  onClose: () => void;
}) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchRecords = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/weighbridge/records?id=${wbId}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to fetch records");
        }

        setRecords(data.records || []);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRecords();

    return () => controller.abort();
  }, [wbId]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-teal/40 bg-[#1a1d1c] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-teal/30 bg-[#202624] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-accent sm:text-xl">
              Last 60 Responses
            </h2>
            <p className="mt-1 text-xs text-muted">
              WEIGHBRIDGE {wbId} · Database records
            </p>
          </div>

          <span className="text-sm font-semibold text-accent">
            {records.length} of 60 Records
          </span>
        </div>

        <div className="relative min-h-0 flex-1 overflow-auto bg-[#1a1d1c] p-3 sm:p-4">
          {loading ? (
            <p className="p-6 text-center text-muted">Loading records...</p>
          ) : error ? (
            <p className="p-6 text-center text-red-400">{error}</p>
          ) : records.length === 0 ? (
            <p className="p-6 text-center text-muted">
              No records found for this weighbridge.
            </p>
          ) : (
            <table className="w-full min-w-[850px] border-collapse text-sm">
              <thead className="sticky top-0 z-30 bg-[#245f56] text-white">
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
                      className="border border-white/15 px-3 py-3 text-left font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {records.map((record, index) => (
                  <tr
                    key={`${record.rfno}-${index}`}
                    className="border-b border-white/10 hover:bg-white/5"
                  >
                    <td className="border border-white/10 px-3 py-3 text-center text-muted">
                      {record.sno ?? index + 1}
                    </td>
                    <td className="border border-white/10 px-3 py-3 text-accent">
                      {display(record.rfno)}
                    </td>
                    <td className="border border-white/10 px-3 py-3 text-white">
                      {display(record.truckno)}
                    </td>
                    <td className="border border-white/10 px-3 py-3 font-semibold text-accent">
                      {display(record.weight)}
                    </td>
                    <td className="border border-white/10 px-3 py-3 text-green-400">
                      {display(record.status)}
                    </td>
                    <td className="whitespace-nowrap border border-white/10 px-3 py-3 text-muted">
                      {display(record.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-[#202624] px-5 py-4">
          <p className="text-xs text-muted">Records retrieved from MySQL</p>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-red-600 px-6 py-2.5 font-semibold text-white transition hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WeighbridgeScreen({
  weighbridges,
}: {
  weighbridges: Weighbridge[];
}) {
  const [selectedId, setSelectedId] = useState<number>(
    Number(weighbridges[0]?.WBID ?? 0),
  );

  const [live, setLive] = useState<LiveData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showRecords, setShowRecords] = useState(false);

  useEffect(() => {
    if (!selectedId) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      if (!active) return;

      try {
        setLoading((current) => current || !live);

        const response = await fetch(
          `/api/weighbridge/status?id=${selectedId}`,
          { cache: "no-store" },
        );

        const raw = await response.text();

        if (!response.ok) {
          let message = `Controller request failed (${response.status})`;

          try {
            message = JSON.parse(raw).message ?? message;
          } catch {
            // Keep fallback message.
          }

          throw new Error(message);
        }

        const data = parseControllerResponse(raw, selectedId);

        if (active) {
          setLive(data);
          setError("");
        }
      } catch (e) {
        if (active) {
          setError(
            e instanceof Error ? e.message : "Unable to read live status",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          timer = setTimeout(poll, 2000);
        }
      }
    };

    setLive(null);
    setError("");
    setLoading(true);

    void poll();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <section>
      {/* WEIGHBRIDGE BUTTONS */}
      <div className="mb-4 flex flex-wrap gap-2">
        {weighbridges.map((wb) => {
          const id = Number(wb.WBID);
          const active = id === selectedId;

          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSelectedId(id);
                setShowRecords(false);
              }}
              aria-pressed={active}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-accent font-semibold text-page"
                  : "bg-pill text-pill-text hover:bg-white/10"
              }`}
            >
              {display(wb.LOCNAME, `WEIGHBRIDGE ${id}`)}
            </button>
          );
        })}
      </div>

      {selectedId > 0 && (
        <>
          {/* SHOW LAST 60 RECORDS BUTTON */}
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setShowRecords(true)}
              className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-page shadow transition hover:brightness-110"
            >
              <span className="mr-2">▤</span>
              Show Last 60 Records
            </button>
          </div>

          {/* DASHBOARD */}
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="card rounded-2xl border border-teal/40 p-4 sm:p-5">
              {/* COUNTERS AND WEIGHT */}
              <div className="grid items-center gap-4 md:grid-cols-[1fr_1fr_1fr_1.5fr]">
                {[
                  ["TRUCK ENTRY COUNT", "ENTCNT"],
                  ["WEIGHT CHECK COUNT", "UPDCNT"],
                  ["SENSOR CLEAR COUNT", "CLRCNT"],
                ].map(([label, key]) => (
                  <div key={key} className="text-center">
                    <p className="mb-2 text-xs text-muted">{label}</p>

                    <div className="rounded-lg border border-white/10 bg-[#252a28] px-3 py-2 text-xl font-semibold text-accent">
                      {display(live?.[key], loading ? "…" : "0")}
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-center gap-4">
                  <span className="text-2xl font-bold text-accent">
                    WB - {selectedId}
                  </span>

                  <div className="min-w-28 rounded-lg bg-black px-4 py-2 text-center text-3xl font-bold text-red-500">
                    {display(live?.WB1WT, "00000")}
                  </div>
                </div>
              </div>

              {/* WEIGHBRIDGE DIAGRAM - PHP STYLE */}
              <div className="mt-5 overflow-hidden rounded-xl border border-teal/30 bg-[#111514] p-3 sm:p-5">
                {/* RFID AND TRUCK NUMBER */}
                <div className="mx-auto flex w-full max-w-xl flex-col gap-1">
                  <div className="rounded-md border border-white/10 bg-[#252a28] px-4 py-2 text-center text-xl text-accent sm:text-2xl">
                    {display(live?.RFNO, "RFID No.")}
                  </div>

                  <div className="rounded-md border border-white/10 bg-[#252a28] px-4 py-2 text-center text-xl text-accent sm:text-2xl">
                    {display(live?.TRKNO, "Truck No.")}
                  </div>
                </div>

                {/* WEIGHBRIDGE DIAGRAM AREA */}
                <div className="relative mt-5 h-[260px] sm:h-[300px]">
                  {/* TRAFFIC LIGHT LEFT */}
                  <div className="absolute left-[20%] top-0 z-10">
                    <Signal green={isOn(live?.TL1GREEN)} />
                    <div className="mx-auto h-[174px] w-2 bg-[#754047]" />
                  </div>

                  {/* TRAFFIC LIGHT RIGHT */}
                  <div className="absolute right-[20%] top-0 z-10">
                    <Signal green={isOn(live?.TL2GREEN)} />
                    <div className="mx-auto h-[174px] w-2 bg-[#754047]" />
                  </div>

                  {/* SENSOR S4 - LEFT END */}
                  <div className="absolute left-[2%] top-[95px] z-10 flex flex-col items-center">
                    <Sensor label="S4" active={isOn(live?.SENSOR4STAT)} />
                    <div className="h-[99px] w-2 bg-[#754047]" />
                  </div>

                  {/* SENSOR S1 */}
                  <div className="absolute left-[26%] top-[95px] z-10 flex flex-col items-center">
                    <Sensor label="S1" active={isOn(live?.SENSOR1STAT)} />
                    <div className="h-[99px] w-2 bg-[#754047]" />
                  </div>

                  {/* SENSOR S2 */}
                  <div className="absolute left-1/2 top-[95px] z-10 flex -translate-x-1/2 flex-col items-center">
                    <Sensor label="S2" active={isOn(live?.SENSOR2STAT)} />
                    <div className="h-[99px] w-2 bg-[#754047]" />
                  </div>

                  {/* SENSOR S3 */}
                  <div className="absolute right-[26%] top-[95px] z-10 flex flex-col items-center">
                    <Sensor label="S3" active={isOn(live?.SENSOR3STAT)} />
                    <div className="h-[99px] w-2 bg-[#754047]" />
                  </div>

                  {/* SENSOR S5 - RIGHT END */}
                  <div className="absolute right-[2%] top-[95px] z-10 flex flex-col items-center">
                    <Sensor label="S5" active={isOn(live?.SENSOR5STAT)} />
                    <div className="h-[99px] w-2 bg-[#754047]" />
                  </div>

                  {/* LEFT BOOM BARRIER */}
                  <div className="absolute left-[4%] top-[120px] z-20 h-16 w-7">
                    {/* Barrier pillar */}
                    <div className="h-[110px] w-7 rounded-t-sm bg-[#d83c19]" />

                    {/* Animated arm */}
                    <div
                      className="absolute left-5 top-2 h-2 w-[125px] origin-left border border-gray-400 shadow-md transition-transform duration-700 ease-in-out"
                      style={{
                        transform: isOn(live?.BB1STAT)
                          ? "rotate(-55deg)"
                          : "rotate(0deg)",
                        background:
                          "repeating-linear-gradient(135deg, #ffffff 0px, #ffffff 9px, #e52323 9px, #e52323 14px)",
                      }}
                    />
                  </div>

                  {/* RIGHT BOOM BARRIER */}
                  <div className="absolute right-[4%] top-[120px] z-20 h-16 w-7">
                    {/* Barrier pillar */}
                    <div className="h-[110px] w-7 rounded-t-sm bg-[#d83c19]" />

                    {/* Animated arm */}
                    <div
                      className="absolute right-5 top-2 h-2 w-[125px] origin-right border border-gray-400 shadow-md transition-transform duration-700 ease-in-out"
                      style={{
                        transform: isOn(live?.BB2STAT)
                          ? "rotate(55deg)"
                          : "rotate(0deg)",
                        background:
                          "repeating-linear-gradient(135deg, #ffffff 0px, #ffffff 9px, #e52323 9px, #e52323 14px)",
                      }}
                    />
                  </div>

                  {/* WEIGHBRIDGE PLATFORM */}
                  <div className="absolute bottom-[42px] left-0 right-0 z-10 flex h-7 items-center justify-center bg-[#075477] text-sm font-extrabold tracking-wide text-white">
                    WEIGHBRIDGE - {selectedId}
                  </div>

                  {/* BASE */}
                  <div className="absolute bottom-[16px] left-0 right-0 h-7 bg-[#91b4b9]" />
                </div>

                {/* BOOM BARRIER STATUS */}
                <div className="mt-2 grid grid-cols-2 gap-3 rounded-lg bg-[#252a28] px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-300">Boom barrier 1</span>
                    <span
                      className={
                        isOn(live?.BB1STAT)
                          ? "font-semibold text-green-400"
                          : "font-semibold text-red-400"
                      }
                    >
                      {isOn(live?.BB1STAT) ? "OPEN" : "CLOSED"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-300">Boom barrier 2</span>
                    <span
                      className={
                        isOn(live?.BB2STAT)
                          ? "font-semibold text-green-400"
                          : "font-semibold text-red-400"
                      }
                    >
                      {isOn(live?.BB2STAT) ? "OPEN" : "CLOSED"}
                    </span>
                  </div>
                </div>

                {/* CURRENT STATUS */}
                <div className="mt-3 min-h-24 rounded-lg bg-black p-3 text-sm text-cyan-300">
                  {display(live?.CURSTATUS, "Waiting for controller status...")}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-muted">
                  Current Tag:{" "}
                  <strong className="text-accent">
                    {display(live?.CURRENTRFID)}
                  </strong>
                </span>

                <span className={error ? "text-red-400" : "text-muted"}>
                  {error ||
                    (live
                      ? "Live · refreshes every 2 seconds"
                      : "Connecting to controller…")}
                </span>
              </div>
            </div>

            {/* DEVICE STATUS */}
            <DeviceStatus live={live ?? {}} />
          </div>
        </>
      )}

      {/* LAST 60 RECORDS MODAL */}
      {showRecords && selectedId > 0 && (
        <LastRecordsModal
          wbId={selectedId}
          onClose={() => setShowRecords(false)}
        />
      )}
    </section>
  );
}

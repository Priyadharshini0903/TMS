
"use client";

import { useCallback, useEffect, useState } from "react";

type Gate = {
  SID: number;
  LOCATION: string;
};

type Rec = {
  STAGE: string;
  RFNO: string;
  TRUCKNO: string;
  RESPONSE: string;
  UPDATETIME: string;
};

type Live = Record<string, string | number | boolean | null>;

const SUCCESS_INTERVAL = 1000;
const INITIAL_RETRY = 1000;
const MAX_RETRY = 30000;
const REQUEST_TIMEOUT = 8000;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function GateScreen({ gates }: { gates: Gate[] }) {
  const [sid, setSid] = useState(gates[0]?.SID ?? 0);
  const [live, setLive] = useState<Live | null>(null);
  const [err, setErr] = useState("");

  const [recs, setRecs] = useState<Rec[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // LIVE STATUS: Sequential polling with exponential backoff
  // LIVE STATUS: Cancellable polling with exponential backoff
useEffect(() => {
  if (!sid) return;

  const lifecycle = new AbortController();

  let retryDelay = INITIAL_RETRY;
  let activeRequest: AbortController | null = null;

  setLive(null);
  setErr("");

  // Wait until the browser tab becomes visible.
  // The listener is always removed when resolved or cancelled.
  const waitUntilVisible = (): Promise<boolean> => {
    if (lifecycle.signal.aborted) {
      return Promise.resolve(false);
    }

    if (!document.hidden) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const cleanup = () => {
        document.removeEventListener("visibilitychange", checkVisibility);
        lifecycle.signal.removeEventListener("abort", handleAbort);
      };

      const checkVisibility = () => {
        if (!document.hidden) {
          cleanup();
          resolve(true);
        }
      };

      const handleAbort = () => {
        cleanup();
        resolve(false);
      };

      document.addEventListener("visibilitychange", checkVisibility);
      lifecycle.signal.addEventListener("abort", handleAbort, { once: true });

      // Check again in case visibility changed during listener setup.
      checkVisibility();

      if (lifecycle.signal.aborted) {
        handleAbort();
      }
    });
  };

  // Cancellable delay: switching gates or leaving the page
  // immediately stops the pending wait.
  const delay = (ms: number): Promise<boolean> => {
    return new Promise((resolve) => {
      if (lifecycle.signal.aborted) {
        resolve(false);
        return;
      }

      const timer = setTimeout(() => {
        cleanup();
        resolve(true);
      }, ms);

      const handleAbort = () => {
        clearTimeout(timer);
        cleanup();
        resolve(false);
      };

      const cleanup = () => {
        lifecycle.signal.removeEventListener("abort", handleAbort);
      };

      lifecycle.signal.addEventListener("abort", handleAbort, {
        once: true,
      });

      if (lifecycle.signal.aborted) {
        handleAbort();
      }
    });
  };

  const handleVisibility = () => {
    if (document.hidden) {
      activeRequest?.abort();
    }
  };

  document.addEventListener("visibilitychange", handleVisibility);

  const poll = async () => {
    while (!lifecycle.signal.aborted) {
      const visible = await waitUntilVisible();

      if (!visible || lifecycle.signal.aborted) break;

      const requestController = new AbortController();
      activeRequest = requestController;

      let timeout: ReturnType<typeof setTimeout> | undefined;
      let success = false;
      let failed = false;

      try {
        timeout = setTimeout(() => {
          requestController.abort();
        }, REQUEST_TIMEOUT);

        const response = await fetch(
          `/api/gate-status?id=${sid}`,
          {
            cache: "no-store",
            signal: requestController.signal,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP ${response.status}`
          );
        }

        const data: Live = await response.json();

        if (lifecycle.signal.aborted) break;

        if (requestController.signal.aborted) {
          if (document.hidden) continue;
          throw new Error("Gate status request timed out");
        }

        if (data.error) {
          throw new Error("Gate status unavailable");
        }

        if (!data.SID || Number(data.SID) === sid) {
          setLive(data);
          setErr("");
          success = true;
        } else {
          throw new Error("Received data for another gate");
        }
      } catch (error) {
        if (lifecycle.signal.aborted) break;

        // A hidden tab intentionally cancels its active request.
        if (document.hidden && requestController.signal.aborted) {
          continue;
        }

        failed = true;
        console.error("Gate status error:", error);
        setErr("Disconnected - retrying...");
      } finally {
        if (timeout) clearTimeout(timeout);

        if (activeRequest === requestController) {
          activeRequest = null;
        }
      }

      if (success) {
        retryDelay = INITIAL_RETRY;
      } else if (failed) {
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY);
      }

      const waited = await delay(
        success ? SUCCESS_INTERVAL : retryDelay
      );

      if (!waited) break;
    }
  };

  void poll();

  return () => {
    lifecycle.abort();
    activeRequest?.abort();
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}, [sid]);

  // HISTORICAL RECORDS: Fetch only when gate changes
  // or the user manually refreshes.
  const loadRecords = useCallback(
    async (signal: AbortSignal) => {
      setRecordsLoading(true);
      setRecordsError("");

      try {
        const response = await fetch(
          `/api/gate-records?id=${sid}`,
          {
            cache: "no-store",
            signal,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          console.error("Gate Records API Error:", errorData);

          throw new Error(
            errorData.message || `HTTP ${response.status}`
          );
        }
        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid records response");
        }

        if (!signal.aborted) {
          setRecs(data);
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error("Gate records error:", error);
          setRecordsError("Unable to load gate records.");
        }
      } finally {
        if (!signal.aborted) {
          setRecordsLoading(false);
        }
      }
    },
    [sid]
  );

  useEffect(() => {
    if (!sid) return;

    const controller = new AbortController();

    setRecs([]);
    loadRecords(controller.signal);

    return () => {
      controller.abort();
    };
  }, [sid, refreshKey, loadRecords]);

 const devices: [string, unknown, unknown][] = (
  [
    ["Reader", live?.RFIDIP, live?.RFIDSTATUS],
    ["DSP", live?.DSPIP, live?.DSPSTATUS],
    ["DIO", live?.DIOIP, live?.DIOSTATUS],
  ] as [string, unknown, unknown][]
).filter((device) => Boolean(device[1]));

  const Row = ({
    k,
    v,
  }: {
    k: string;
    v: React.ReactNode;
  }) => (
    <div className="flex justify-between border-b border-pill py-2 gap-3">
      <span className="text-muted">{k}</span>
      <span className="font-semibold text-right">{v ?? "-"}</span>
    </div>
  );

  return (
    <div>
      {/* GATE SELECTION */}
      <div className="mb-4 flex flex-wrap gap-2">
        {gates.map((g) => (
          <button
            key={g.SID}
            onClick={() => setSid(g.SID)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              g.SID === sid
                ? "bg-accent font-semibold text-page"
                : "bg-pill text-pill-text"
            }`}
          >
            {g.LOCATION}
          </button>
        ))}
      </div>

      {/* LIVE STATUS */}
      <div className="card rounded-2xl border border-teal/40 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-accent">
              {live?.LOCATION ?? "…"}
            </div>

            <div className="text-sm text-muted">
              STAGE - {live?.STAGE ?? "-"}
            </div>
          </div>

          <span
            className={`rounded px-3 py-1 text-sm ${
              err ? "bg-badge" : "bg-teal"
            }`}
          >
            {err || (live ? "Connected" : "Connecting…")}
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Row
              k="Last Truck No"
              v={
                <span className="text-xl text-accent">
                  {live?.TRKNO}
                </span>
              }
            />

            <Row k="RFID No" v={live?.RFNO} />
            <Row k="Status" v={live?.DATASTATUS} />
          </div>

          <div>
            <Row k="Current RFTAG" v={live?.CURRENTRFID} />
            <Row k="Current Process" v={live?.timestamp} />

            {devices.map(([name, ip, status]) => (
              <Row
                key={name}
                k={`${name} ${ip}`}
                v={
                  <span
                    className={
                      status
                        ? "text-accent"
                        : "text-badge"
                    }
                  >
                    {status ? "Healthy" : "Network Issue"}
                  </span>
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* LAST 60 RECORDS */}
      <div className="card mt-6 overflow-x-auto rounded-2xl border border-teal/40 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-accent">
              Last 60 RFID Responses
            </div>

            <div className="text-sm text-muted">
              {recs.length} of 60 Records
            </div>
          </div>

          <button
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={recordsLoading}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-page disabled:cursor-not-allowed disabled:opacity-50"
          >
            {recordsLoading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {recordsError && (
          <div className="mb-3 text-sm text-badge">
            {recordsError}
          </div>
        )}

        {recordsLoading && (
          <div className="py-3 text-center text-sm text-muted">
            Loading records...
          </div>
        )}

        {!recordsLoading && !recordsError && recs.length === 0 && (
          <div className="py-6 text-center text-sm text-muted">
            No RFID records found.
          </div>
        )}

        <table className="w-full text-left text-sm">
          <thead className="text-accent">
            <tr>
              <th className="p-2">Sno</th>
              <th>Stage</th>
              <th>RFID No</th>
              <th>Truck No</th>
              <th>Status</th>
              <th>Timestamp</th>
            </tr>
          </thead>

          <tbody>
            {recs.map((r, i) => (
              <tr
                key={`${r.RFNO}-${r.UPDATETIME}-${i}`}
                className="border-t border-pill"
              >
                <td className="p-2">{i + 1}</td>
                <td>{r.STAGE}</td>
                <td>{r.RFNO}</td>
                <td>{r.TRUCKNO}</td>
                <td>{r.RESPONSE}</td>
                <td>{String(r.UPDATETIME ?? "-")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

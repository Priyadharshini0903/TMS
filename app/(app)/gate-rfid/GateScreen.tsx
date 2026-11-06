"use client";
import { useEffect, useState } from "react";

type Gate = { SID: number; LOCATION: string };
type Rec = { RFNO: string; TRUCKNO: string; STATUS: string; DatTim: string };
type Live = Record<string, string | number | boolean | null>;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function GateScreen({ gates }: { gates: Gate[] }) {
  const [sid, setSid] = useState(gates[0]?.SID ?? 0);
  const [live, setLive] = useState<Live | null>(null);
  const [err, setErr] = useState("");
  const [recs, setRecs] = useState<Rec[]>([]);

  useEffect(() => {
    if (!sid) return;
    let alive = true;
    setLive(null);
    setErr("");
    setRecs([]);
    (async () => {
      while (alive) {
        try {
          const d = await (await fetch(`/api/gate-status?id=${sid}`, { cache: "no-store" })).json();
          if (!alive) return;
          if (d.error) { setErr(d.message); await sleep(5000); }
          else if (!d.SID || d.SID === sid) { setLive(d); setErr(""); }
        } catch {
          if (!alive) return;
          setErr("Disconnected - retrying...");
          await sleep(5000);
        }
        await sleep(1000);
      }
    })();
    fetch(`/api/gate-records?id=${sid}`)
      .then((r) => r.json())
      .then((d) => alive && Array.isArray(d) && setRecs(d));
    return () => { alive = false; };
  }, [sid]);

  const devices = [
    ["Reader", live?.RFIDIP, live?.RFIDSTATUS],
    ["DSP", live?.DSPIP, live?.DSPSTATUS],
    ["DIO", live?.DIOIP, live?.DIOSTATUS],
  ].filter((d) => d[1]);

  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <div className="flex justify-between border-b border-pill py-2">
      <span className="text-muted">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {gates.map((g) => (
          <button
            key={g.SID}
            onClick={() => setSid(g.SID)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              g.SID === sid ? "bg-accent font-semibold text-page" : "bg-pill text-pill-text"
            }`}
          >
            {g.LOCATION}
          </button>
        ))}
      </div>

      <div className="card rounded-2xl border border-teal/40 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-accent">{live?.LOCATION ?? "…"}</div>
            <div className="text-sm text-muted">STAGE - {live?.STAGE ?? "-"}</div>
          </div>
          <span className={`rounded px-3 py-1 text-sm ${err ? "bg-badge" : "bg-teal"}`}>
            {err ? err : live ? "Connected" : "Connecting…"}
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Row k="Last Truck No" v={<span className="text-xl text-accent">{live?.TRKNO}</span>} />
            <Row k="RFID No" v={live?.RFNO} />
            <Row k="Status" v={live?.DATASTATUS} />
          </div>
          <div>
            <Row k="Current RFTAG" v={live?.CURRENTRFID} />
            <Row k="Current Process" v={live?.timestamp} />
            {devices.map(([n, ip, ok]) => (
              <Row
                key={n as string}
                k={`${n} ${ip}`}
                v={<span className={ok ? "text-accent" : "text-badge"}>{ok ? "Healthy" : "Network Issue"}</span>}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-6 overflow-x-auto rounded-2xl border border-teal/40 p-4">
        <div className="mb-2 text-sm text-muted">{recs.length} of 60 Records</div>
        <table className="w-full text-left text-sm">
          <thead className="text-accent">
            <tr><th className="p-2">Sno</th><th>RFID No</th><th>Truck No</th><th>Status</th><th>Timestamp</th></tr>
          </thead>
          <tbody>
            {recs.map((r, i) => (
              <tr key={i} className="border-t border-pill">
                <td className="p-2">{i + 1}</td><td>{r.RFNO}</td><td>{r.TRUCKNO}</td><td>{r.STATUS}</td><td>{String(r.DatTim)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
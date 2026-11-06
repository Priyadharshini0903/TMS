"use client";
import { useEffect, useState } from "react";

type Row = {
  LOCATION?: string;
  RFIDIP?: string;
  RFIDSTATUS?: boolean | null;
  DSPIP?: string;
  DSPSTATUS?: boolean | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Health({ ok }: { ok?: boolean | null }) {
  if (ok === undefined || ok === null) return null;
  return (
    <span className={`inline-flex items-center gap-3 font-semibold ${ok ? "text-accent" : "text-badge"}`}>
      {ok ? "Healthy" : "Network Issue"}
      <span className={`h-5 w-5 rounded ${ok ? "bg-accent" : "bg-badge"}`} />
    </span>
  );
}

export default function DeviceStatus() {
  const [rows, setRows] = useState<Row[]>([]);
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      while (alive) {
        const t = Date.now();
        try {
          const d = await (await fetch("/api/gate-status?id=22", { cache: "no-store" })).json();
          if (!alive) return;
          if (!Array.isArray(d)) throw new Error("bad response");
          setRows(d);
          setOk(true);
        } catch {
          if (!alive) return;
          setOk(false);
          await sleep(5000);
        }
        await sleep(Math.max(0, 7000 - (Date.now() - t))); // 7s cycle, same as PHP
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold italic text-accent">DEVICE STATUS</h1>
        <span className={`rounded px-3 py-1 text-sm ${ok === false ? "bg-badge" : "bg-teal"}`}>
          {ok === null ? "Connecting…" : ok ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div className="card overflow-x-auto rounded-2xl border border-teal/40 p-4">
        <table className="w-full text-left text-sm">
          <thead className="text-accent">
            <tr>
              <th className="p-2">Sno</th>
              <th>LOCATION</th>
              <th>READER IP</th>
              <th>READER STATUS</th>
              <th>DISPLAY IP</th>
              <th>DISPLAY STATUS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-pill">
                <td className="p-2">{i + 1}</td>
                <td>{r.LOCATION}</td>
                <td>{r.RFIDIP}</td>
                <td><Health ok={r.RFIDSTATUS} /></td>
                <td>{r.DSPIP}</td>
                <td><Health ok={r.DSPSTATUS} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
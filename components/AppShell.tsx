"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Props = {
  plantId: string;
  plantCode: string;
  mode?: string;
  truckReg: boolean;
  autoWb: boolean;
  raw: boolean;
  bulker: boolean;
  children: React.ReactNode;
};

export default function AppShell({
  plantId,
  plantCode,
  mode,
  truckReg,
  autoWb,
  raw,
  bulker,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const [rep, setRep] = useState(false);
  const [brep, setBrep] = useState(false);
  const path = usePathname();

  const item = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      onClick={() => setOpen(false)}
      className={`block rounded-lg px-4 py-2 text-sm ${
        path === href
          ? "bg-accent/15 text-accent"
          : "text-white hover:bg-white/5"
      }`}
    >
      {label}
    </Link>
  );

  const toggle = (label: string, on: boolean, set: (v: boolean) => void) => (
    <button
      onClick={() => set(!on)}
      className="flex w-full justify-between rounded-lg px-4 py-2 text-sm text-white hover:bg-white/5"
    >
      {label} <span className="text-teal">{on ? "▾" : "▸"}</span>
    </button>
  );

  const main: [string, string, boolean][] = [
    ["/truck-registration", "Truck Registration", truckReg],
    ["/gate-rfid", "Gate RFID(s)", true],
    ["/weighbridges", "Weighbridge(s)", autoWb],
    ["/raw-weighbridge", "Raw Weighbridge(s)", raw],
    ["/bulker", "Bulker(s)", bulker],
    ["/device-status", "Device(s) Status", true],
  ];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-20 flex h-12 items-center justify-between border-b border-teal/40 bg-[#0e1110] px-4">
        <button
          onClick={() => setOpen(true)}
          aria-label="Menu"
          className="rounded bg-accent px-3 py-1 text-page"
        >
          ☰
        </button>

        <div className="text-center font-bold italic">
          <sup className="mr-2 text-xs text-accent">
            {plantId}({plantCode})
          </sup>
          ACCSYS RFID/WB CONTROL SYSTEM
          <sup className="ml-2 text-xs text-teal">{mode}</sup>
        </div>

        <div className="flex items-center gap-3 text-sm italic">
          <span className="hidden sm:inline">Welcome : {plantId}</span>
          <a
            href="/logout"
            className="rounded bg-pill px-3 py-1 text-pill-text"
          >
            Logout
          </a>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      <nav
        className={`fixed left-0 top-0 z-40 h-full w-64 overflow-y-auto p-3 transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "linear-gradient(180deg,#1b1f1e,#0e1110)",
        }}
      >
        <button
          onClick={() => setOpen(false)}
          className="mb-3 text-sm text-muted"
        >
          ✕ Close
        </button>

        <div className="space-y-1">
          {main.filter((m) => m[2]).map(([h, l]) => item(h, l))}

          {toggle("Report(s)", rep, setRep)}

          {rep && (
            <div className="ml-3 space-y-1 border-l border-teal/40 pl-2">
              {item("/Reports/location-wise-report", "Location Report")}

              {autoWb &&
                item("/Reports/weighbridge-wise-report", "Weighbridge Report")}

              {raw &&
                item("/Reports/raw-wb-wise-report", "Raw Weighbridge Report")}

              {bulker && (
                <>
                  {toggle("Bulker Report(s)", brep, setBrep)}

                  {brep && (
                    <div className="ml-3 space-y-1 border-l border-teal/40 pl-2">
                      {item("/Reports/bulker-wise-report", "Bulker Report")}
                      {item("/Reports/wb-wise-report", "Bulker Weight Report")}
                    </div>
                  )}
                </>
              )}

              {item("/Reports/api-logs-report", "APILogs Report")}
              {item("/Reports/rfid-sense-report", "RFID Sense Report")}
              {item(
                "/Reports/transaction-logs-report",
                "Transaction Logs Report",
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="pt-12">{children}</div>
    </>
  );
}

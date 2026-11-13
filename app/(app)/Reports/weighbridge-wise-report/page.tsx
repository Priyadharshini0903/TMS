
"use client";

import { useEffect, useMemo, useState } from "react";

type Weighbridge = {
  WBID: number;
  LOCNAME: string;
};

type ReportRow = {
  WBID: number;
  RFNO: string;
  TRUCKNO: string;
  WEIGHT: number | string;
  STATUS: string;
  DatTim: string;
  Center_Position?: string;
  RfCard_Detect?: string;
  EligibleSend?: string;
  EligibleReply?: string;
  StableCnt_Start?: string;
  StableCnt_End?: string;
  WeightService_Send?: string;
  WeighService_End?: string;
  TimeDifferenceFormatted?: string;
};

export default function WeighbridgeWiseReportPage() {
  const [mode, setMode] = useState<"DateWithWb" | "TruckOnly">("DateWithWb");
  const [date, setDate] = useState("2026-11-11");
  const [weighbridge, setWeighbridge] = useState("ALL");
  const [truckNo, setTruckNo] = useState("");

  const [weighbridges, setWeighbridges] = useState<Weighbridge[]>([]);
  const [rows, setRows] = useState<ReportRow[]>([]);

  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    async function loadWeighbridges() {
      try {
        const response = await fetch(
          "/api/reports/weighbridge-wise?action=weighbridges"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load weighbridges.");
        }

        setWeighbridges(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load weighbridges."
        );
      }
    }

    loadWeighbridges();
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.toLowerCase();

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const paginatedRows = filteredRows.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  async function getData() {
    if (mode === "DateWithWb" && !date) {
      alert("Please select a date.");
      return;
    }

    if (mode === "DateWithWb" && !weighbridge) {
      alert("Please select a weighbridge.");
      return;
    }

    if (mode === "TruckOnly" && !truckNo.trim()) {
      alert("Please enter truck number.");
      return;
    }

    setLoading(true);
    setError("");
    setRows([]);
    setSearch("");
    setPage(1);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      params.set("reqType", mode);

      if (mode === "DateWithWb") {
        params.set("date", date);
        params.set("weighbridge", weighbridge);
      } else {
        params.set("truckNo", truckNo.trim());
      }

      const response = await fetch(
        `/api/reports/weighbridge-wise?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load report.");
      }

      setRows(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load report."
      );
    } finally {
      setLoading(false);
    }
  }

  function exportExcel() {
    if (!filteredRows.length) {
      alert("No records available to export.");
      return;
    }

    const headers = [
      "SNO",
      "WEIGHBRIDGE",
      "RFID NO",
      "TRUCK NO",
      "WEIGHT",
      "STATUS",
      "RESPONSE TIMESTAMP",
      "CENTER POSITION",
      "RF CARD DETECT",
      "ELIGIBLE SEND",
      "ELIGIBLE REPLY",
      "STABLE COUNT START",
      "STABLE COUNT END",
      "WEIGHT SERVICE SEND",
      "WEIGH SERVICE END",
      "TIME DIFFERENCE",
    ];

    const csvRows = filteredRows.map((row, index) => [
      index + 1,
      `WB-${row.WBID}`,
      row.RFNO,
      row.TRUCKNO,
      row.WEIGHT,
      row.STATUS,
      row.DatTim,
      row.Center_Position,
      row.RfCard_Detect,
      row.EligibleSend,
      row.EligibleReply,
      row.StableCnt_Start,
      row.StableCnt_End,
      row.WeightService_Send,
      row.WeighService_End,
      row.TimeDifferenceFormatted,
    ]);

    const csv = [headers, ...csvRows]
      .map((row) =>
        row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "WeighbridgeWiseReport.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const card: React.CSSProperties = {
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  };

  const input: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #CBD5E1",
    borderRadius: 6,
    background: "#F1F5F9",
    color: "#0F172A",
    fontSize: 14,
  };

  const button: React.CSSProperties = {
    padding: "10px 18px",
    border: 0,
    borderRadius: 6,
    background: "#0E7490",
    color: "#FFFFFF",
    cursor: "pointer",
    fontWeight: 700,
  };

  const th: React.CSSProperties = {
    padding: 12,
    background: "#F1F5F9",
    color: "#0E7490",
    textAlign: "center",
    fontSize: 12,
    whiteSpace: "nowrap",
    borderBottom: "1px solid #CBD5E1",
  };

  const td: React.CSSProperties = {
    padding: 12,
    textAlign: "center",
    fontSize: 13,
    color: "#0F172A",
    borderBottom: "1px solid #CBD5E1",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ padding: 24, background: "#F8FAFC", minHeight: "100vh", color: "#0F172A" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0E7490", marginBottom: 24 }}>
        WEIGHBRIDGE WISE REPORT
      </h1>

      <div style={card}>
        <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
          <label>
            <input
              type="radio"
              checked={mode === "DateWithWb"}
              onChange={() => {
                setMode("DateWithWb");
                setRows([]);
                setSearched(false);
                setError("");
              }}
            />{" "}
            Weighbridge with Datewise
          </label>

          <label>
            <input
              type="radio"
              checked={mode === "TruckOnly"}
              onChange={() => {
                setMode("TruckOnly");
                setRows([]);
                setSearched(false);
                setError("");
              }}
            />{" "}
            Truck No Only
          </label>
        </div>

        {mode === "DateWithWb" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13 }}>
                Select Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={input}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13 }}>
                Weighbridge *
              </label>
              <select
                value={weighbridge}
                onChange={(e) => setWeighbridge(e.target.value)}
                style={input}
              >
                <option value="ALL">ALL</option>
                {weighbridges.map((wb) => (
                  <option key={wb.WBID} value={wb.WBID}>
                    {wb.LOCNAME}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 500 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13 }}>
              Enter Truck Number *
            </label>
            <input
              value={truckNo}
              onChange={(e) => setTruckNo(e.target.value)}
              placeholder="eg: XX12Q5100"
              style={input}
            />
          </div>
        )}

        <button onClick={getData} disabled={loading} style={{ ...button, marginTop: 22, opacity: loading ? 0.6 : 1 }}>
          {loading ? "Please wait..." : "Get Data"}
        </button>

        {error && (
          <p style={{ color: "#DC2626", marginTop: 14 }}>{error}</p>
        )}
      </div>

      {searched && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, color: "#0E7490", fontWeight: 700 }}>
              Report Details
            </h2>
            <button onClick={exportExcel} style={button}>Export Excel</button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={{ ...input, width: 100 }}
            >
              {[5, 10, 15, 20, 50, 100, 5000].map((size) => (
                <option key={size} value={size}>
                  {size === 5000 ? "ALL" : size}
                </option>
              ))}
            </select>

            <input
              placeholder="Search report..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ ...input, width: 260 }}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
              <thead>
                <tr>
                  {[
                    "SNO",
                    "WEIGHBRIDGE",
                    "RFID NO",
                    "TRUCK NO",
                    "WEIGHT",
                    "STATUS",
                    "RESPONSE TIMESTAMP",
                    "CENTER POSITION",
                    "RF CARD DETECT",
                    "ELIGIBLE SEND",
                    "ELIGIBLE REPLY",
                    "STABLE COUNT START",
                    "STABLE COUNT END",
                    "WEIGHT SERVICE SEND",
                    "WEIGH SERVICE END",
                    "TIME DIFFERENCE",
                  ].map((heading) => (
                    <th key={heading} style={th}>{heading}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map((row, index) => (
                  <tr key={`${row.WBID}-${row.RFNO}-${index}`}>
                    <td style={td}>{(page - 1) * pageSize + index + 1}</td>
                    <td style={td}>WB-{row.WBID}</td>
                    <td style={td}>{row.RFNO || "—"}</td>
                    <td style={td}>{row.TRUCKNO || "—"}</td>
                    <td style={td}>{row.WEIGHT ?? "—"}</td>
                    <td style={td}>{row.STATUS || "—"}</td>
                    <td style={td}>{row.DatTim || "—"}</td>
                    <td style={td}>{row.Center_Position || "—"}</td>
                    <td style={td}>{row.RfCard_Detect || "—"}</td>
                    <td style={td}>{row.EligibleSend || "—"}</td>
                    <td style={td}>{row.EligibleReply || "—"}</td>
                    <td style={td}>{row.StableCnt_Start || "—"}</td>
                    <td style={td}>{row.StableCnt_End || "—"}</td>
                    <td style={td}>{row.WeightService_Send || "—"}</td>
                    <td style={td}>{row.WeighService_End || "—"}</td>
                    <td style={td}>{row.TimeDifferenceFormatted || "—"}</td>
                  </tr>
                ))}

                {!loading && paginatedRows.length === 0 && (
                  <tr>
                    <td colSpan={16} style={{ ...td, padding: 30 }}>
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            <span style={{ color: "#64748B", fontSize: 13 }}>
              Showing {filteredRows.length === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length} records
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button disabled={page === 1} onClick={() => setPage(page - 1)} style={{ ...button, opacity: page === 1 ? 0.4 : 1 }}>
                Previous
              </button>
              <span style={{ color: "#334155", fontSize: 13 }}>
                Page {page} / {totalPages}
              </span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ ...button, opacity: page >= totalPages ? 0.4 : 1 }}>
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

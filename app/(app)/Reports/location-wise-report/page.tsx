
"use client";

import { useMemo, useState } from "react";

type ReportRow = {
  sno: number;
  location: string;
  weighbridge: string;
  truckNo: string;
  rfidNo: string;
  weight: number;
  date: string;
  status: string;
};

const mockData: ReportRow[] = [
  { sno: 1, location: "Main Gate", weighbridge: "WB-1", truckNo: "TN09AB1234", rfidNo: "RF10001", weight: 42500, date: "2026-11-07", status: "Success" },
  { sno: 2, location: "Plant Entry", weighbridge: "WB-2", truckNo: "TN10CD5678", rfidNo: "RF10002", weight: 38200, date: "2026-11-07", status: "Success" },
  { sno: 3, location: "Main Gate", weighbridge: "WB-1", truckNo: "AP05EF9012", rfidNo: "RF10003", weight: 41000, date: "2026-11-07", status: "Success" },
  { sno: 4, location: "Dispatch Gate", weighbridge: "WB-3", truckNo: "TN22GH3456", rfidNo: "RF10004", weight: 39800, date: "2026-11-07", status: "Pending" },
  { sno: 5, location: "Plant Entry", weighbridge: "WB-2", truckNo: "KA03JK7890", rfidNo: "RF10005", weight: 43500, date: "2026-11-06", status: "Success" },
  { sno: 6, location: "Dispatch Gate", weighbridge: "WB-3", truckNo: "TN09LM1122", rfidNo: "RF10006", weight: 40200, date: "2026-11-06", status: "Failed" },
];

export default function LocationWiseReportPage() {
  const [date, setDate] = useState("2026-11-07");
  const [location, setLocation] = useState("ALL");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [searched, setSearched] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      ),
    [rows, search]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const paginatedRows = filteredRows.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  function getData() {
    let result = mockData.filter((row) => row.date === date);

    if (location !== "ALL") {
      result = result.filter((row) => row.location === location);
    }

    setRows(result);
    setSearched(true);
    setSearch("");
    setPage(1);
  }

  function exportExcel() {
    if (!filteredRows.length) {
      alert("No records available to export.");
      return;
    }

    const headers = ["SNO", "LOCATION", "WEIGHBRIDGE", "TRUCK NO", "RFID NO", "WEIGHT", "DATE", "STATUS"];

    const csvRows = filteredRows.map((row, index) => [
      index + 1,
      row.location,
      row.weighbridge,
      row.truckNo,
      row.rfidNo,
      row.weight,
      row.date,
      row.status,
    ]);

    const csv = [headers, ...csvRows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "LocationWiseReport.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const card: React.CSSProperties = {
    background: "#1a1a1a",
    border: "1px solid #303030",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  };

  const input: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #383838",
    borderRadius: 6,
    background: "#111111",
    color: "#ffffff",
    fontSize: 14,
  };

  const button: React.CSSProperties = {
    padding: "10px 18px",
    border: 0,
    borderRadius: 6,
    background: "#a8e6d9",
    color: "#050505",
    cursor: "pointer",
    fontWeight: 700,
  };

  const th: React.CSSProperties = {
    padding: 12,
    background: "#252525",
    color: "#a8e6d9",
    textAlign: "center",
    fontSize: 12,
    whiteSpace: "nowrap",
    borderBottom: "1px solid #383838",
  };

  const td: React.CSSProperties = {
    padding: 12,
    textAlign: "center",
    fontSize: 13,
    color: "#ffffff",
    borderBottom: "1px solid #303030",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ padding: 24, background: "#050505", minHeight: "100vh", color: "#ffffff" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#a8e6d9", marginBottom: 24 }}>
        LOCATION WISE REPORT
      </h1>

      <div style={card}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, color: "#cfd4d2", fontSize: 13 }}>
              Select Date *
            </label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={input} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, color: "#cfd4d2", fontSize: 13 }}>
              Location *
            </label>
            <select value={location} onChange={(e) => setLocation(e.target.value)} style={input}>
              <option value="ALL">ALL</option>
              <option value="Main Gate">Main Gate</option>
              <option value="Plant Entry">Plant Entry</option>
              <option value="Dispatch Gate">Dispatch Gate</option>
            </select>
          </div>
        </div>

        <button onClick={getData} style={{ ...button, marginTop: 22 }}>
          Get Data
        </button>
      </div>

      {searched && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, color: "#a8e6d9", fontWeight: 700 }}>Report Details</h2>
            <button onClick={exportExcel} style={button}>Export Excel</button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} style={{ ...input, width: 100 }}>
              {[5, 10, 15, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
            <input placeholder="Search report..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ ...input, width: 260 }} />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 950 }}>
              <thead>
                <tr>
                  {["SNO", "LOCATION", "WEIGHBRIDGE", "TRUCK NO", "RFID NO", "WEIGHT", "DATE", "STATUS"].map((heading) => (
                    <th key={heading} style={th}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, index) => (
                  <tr key={row.sno}>
                    <td style={td}>{(page - 1) * pageSize + index + 1}</td>
                    <td style={td}>{row.location}</td>
                    <td style={td}>{row.weighbridge}</td>
                    <td style={td}>{row.truckNo}</td>
                    <td style={td}>{row.rfidNo}</td>
                    <td style={td}>{row.weight.toLocaleString("en-IN")}</td>
                    <td style={td}>{row.date}</td>
                    <td style={td}>{row.status}</td>
                  </tr>
                ))}
                {paginatedRows.length === 0 && (
                  <tr><td colSpan={8} style={{ ...td, padding: 30 }}>No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            <span style={{ color: "#8a8f8d", fontSize: 13 }}>
              Showing {filteredRows.length === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length} records
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button disabled={page === 1} onClick={() => setPage(page - 1)} style={{ ...button, opacity: page === 1 ? 0.4 : 1 }}>Previous</button>
              <span style={{ color: "#cfd4d2", fontSize: 13 }}>Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ ...button, opacity: page >= totalPages ? 0.4 : 1 }}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

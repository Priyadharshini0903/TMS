
"use client";

import { useMemo, useState } from "react";

type ReportRow = {
  sno: number;
  weighbridge: string;
  truckNo: string;
  rfidNo: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  date: string;
};

const mockData: ReportRow[] = [
  { sno: 1, weighbridge: "WB-1", truckNo: "TN09AB1234", rfidNo: "RF10001", grossWeight: 42500, tareWeight: 14500, netWeight: 28000, date: "2026-11-07" },
  { sno: 2, weighbridge: "WB-2", truckNo: "TN10CD5678", rfidNo: "RF10002", grossWeight: 38200, tareWeight: 13200, netWeight: 25000, date: "2026-11-07" },
  { sno: 3, weighbridge: "WB-1", truckNo: "AP05EF9012", rfidNo: "RF10003", grossWeight: 41000, tareWeight: 14000, netWeight: 27000, date: "2026-11-07" },
  { sno: 4, weighbridge: "WB-3", truckNo: "TN22GH3456", rfidNo: "RF10004", grossWeight: 39800, tareWeight: 13800, netWeight: 26000, date: "2026-11-07" },
  { sno: 5, weighbridge: "WB-2", truckNo: "KA03JK7890", rfidNo: "RF10005", grossWeight: 43500, tareWeight: 15500, netWeight: 28000, date: "2026-11-06" },
  { sno: 6, weighbridge: "WB-1", truckNo: "TN09LM1122", rfidNo: "RF10006", grossWeight: 40200, tareWeight: 14200, netWeight: 26000, date: "2026-11-06" },
];

export default function WeighbridgeWiseReportPage() {
  const [date, setDate] = useState("2026-11-07");
  const [weighbridge, setWeighbridge] = useState("ALL");
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

    if (weighbridge !== "ALL") {
      result = result.filter((row) => row.weighbridge === weighbridge);
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

    const headers = [
      "SNO",
      "WEIGHBRIDGE",
      "TRUCK NO",
      "RFID NO",
      "GROSS WEIGHT",
      "TARE WEIGHT",
      "NET WEIGHT",
      "DATE",
    ];

    const csvRows = filteredRows.map((row, index) => [
      index + 1,
      row.weighbridge,
      row.truckNo,
      row.rfidNo,
      row.grossWeight,
      row.tareWeight,
      row.netWeight,
      row.date,
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
    link.download = "WeighbridgeWiseReport.csv";
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
        WEIGHBRIDGE WISE REPORT
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
              Weighbridge *
            </label>
            <select value={weighbridge} onChange={(e) => setWeighbridge(e.target.value)} style={input}>
              <option value="ALL">ALL</option>
              <option value="WB-1">WB-1</option>
              <option value="WB-2">WB-2</option>
              <option value="WB-3">WB-3</option>
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
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  {["SNO", "WEIGHBRIDGE", "TRUCK NO", "RFID NO", "GROSS WEIGHT", "TARE WEIGHT", "NET WEIGHT", "DATE"].map((heading) => (
                    <th key={heading} style={th}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, index) => (
                  <tr key={row.sno}>
                    <td style={td}>{(page - 1) * pageSize + index + 1}</td>
                    <td style={td}>{row.weighbridge}</td>
                    <td style={td}>{row.truckNo}</td>
                    <td style={td}>{row.rfidNo}</td>
                    <td style={td}>{row.grossWeight.toLocaleString("en-IN")}</td>
                    <td style={td}>{row.tareWeight.toLocaleString("en-IN")}</td>
                    <td style={td}>{row.netWeight.toLocaleString("en-IN")}</td>
                    <td style={td}>{row.date}</td>
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

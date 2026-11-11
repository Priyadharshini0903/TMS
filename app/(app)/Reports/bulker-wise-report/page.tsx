
"use client";

import { useMemo, useState } from "react";

type ReportRow = {
  wbId: string;
  rfidNo: string;
  truckNo: string;
  weight: number;
  status: string;
  timestamp: string;
};

// Temporary sample data. Replace with API data when DB is ready.
const mockData: ReportRow[] = [
  { wbId: "1", rfidNo: "RF10001", truckNo: "TN09AB1234", weight: 42500, status: "Success", timestamp: "2026-11-07 08:15:20" },
  { wbId: "2", rfidNo: "RF10002", truckNo: "TN10CD5678", weight: 38200, status: "Success", timestamp: "2026-11-07 08:25:40" },
  { wbId: "1", rfidNo: "RF10003", truckNo: "AP05EF9012", weight: 41000, status: "Success", timestamp: "2026-11-07 09:10:12" },
  { wbId: "3", rfidNo: "RF10004", truckNo: "TN22GH3456", weight: 39800, status: "Pending", timestamp: "2026-11-07 09:45:10" },
  { wbId: "2", rfidNo: "RF10005", truckNo: "KA03JK7890", weight: 43500, status: "Success", timestamp: "2026-11-07 10:05:32" },
  { wbId: "1", rfidNo: "RF10006", truckNo: "TN09LM1122", weight: 40200, status: "Success", timestamp: "2026-11-06 11:15:20" },
  { wbId: "3", rfidNo: "RF10007", truckNo: "AP16NP3344", weight: 41700, status: "Failed", timestamp: "2026-11-06 12:25:40" },
];

export default function BulkerWiseReportPage() {
  const [reportType, setReportType] = useState<"date" | "truck" | "">("");
  const [selectedDate, setSelectedDate] = useState("2026-11-07");
  const [weighbridge, setWeighbridge] = useState("ALL");
  const [truckNo, setTruckNo] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [searched, setSearched] = useState(false);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const paginatedRows = filteredRows.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  function getData() {
    if (!reportType) {
      alert("Please select a report type.");
      return;
    }

    if (reportType === "date" && !selectedDate) {
      alert("Please select a date.");
      return;
    }

    if (reportType === "truck" && !truckNo.trim()) {
      alert("Please enter the truck number.");
      return;
    }

    let result = mockData;

    if (reportType === "date") {
      result = result.filter((row) =>
        row.timestamp.startsWith(selectedDate)
      );

      if (weighbridge !== "ALL") {
        result = result.filter((row) => row.wbId === weighbridge);
      }
    }

    if (reportType === "truck") {
      result = result.filter((row) =>
        row.truckNo.toLowerCase().includes(truckNo.trim().toLowerCase())
      );
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
      "RFID NO",
      "TRUCK NO",
      "WEIGHT",
      "STATUS",
      "RESPONSE TIMESTAMP",
    ];

    const csvRows = filteredRows.map((row, index) => [
      index + 1,
      `WB-${row.wbId}`,
      row.rfidNo,
      row.truckNo,
      row.weight,
      row.status,
      row.timestamp,
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
    link.download = "BulkerWiseReport.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const styles: Record<string, React.CSSProperties> = {
    card: {
      background: "white",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      padding: 20,
      marginBottom: 18,
    },
    label: {
      display: "block",
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 7,
      color: "#334155",
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: 6,
      fontSize: 14,
      background: "white",
      color: "#1e293b",
    },
    button: {
      padding: "10px 18px",
      border: 0,
      borderRadius: 6,
      background: "#0E5EAD",
      color: "white",
      cursor: "pointer",
      fontWeight: 600,
    },
    th: {
      background: "#0E5EAD",
      color: "white",
      padding: 12,
      textAlign: "center",
      fontSize: 13,
      whiteSpace: "nowrap",
    },
    td: {
      padding: 11,
      borderBottom: "1px solid #e2e8f0",
      textAlign: "center",
      fontSize: 13,
      whiteSpace: "nowrap",
    },
  };

  return (
    <div style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <div
        style={{
          background: "#0E5EAD",
          color: "white",
          padding: "15px 20px",
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>
          BULKER WISE REPORT
        </h1>
      </div>

      {/* FILTER SECTION */}
      <div style={styles.card}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={reportType === "date"}
              onChange={() => {
                setReportType(reportType === "date" ? "" : "date");
                setSearched(false);
              }}
            />
            Bulker with Datewise
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={reportType === "truck"}
              onChange={() => {
                setReportType(reportType === "truck" ? "" : "truck");
                setSearched(false);
              }}
            />
            Truck no only
          </label>
        </div>

        {reportType === "date" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 18,
              marginTop: 22,
            }}
          >
            <div>
              <label style={styles.label}>Select the date *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Weighbridge *</label>
              <select
                value={weighbridge}
                onChange={(e) => setWeighbridge(e.target.value)}
                style={styles.input}
              >
                <option value="ALL">ALL</option>
                <option value="1">WB-1</option>
                <option value="2">WB-2</option>
                <option value="3">WB-3</option>
              </select>
            </div>
          </div>
        )}

        {reportType === "truck" && (
          <div style={{ marginTop: 22, maxWidth: 400 }}>
            <label style={styles.label}>Enter the Truck No *</label>
            <input
              type="text"
              placeholder="Eg: TN09AB1234"
              value={truckNo}
              onChange={(e) => setTruckNo(e.target.value)}
              style={styles.input}
            />
          </div>
        )}

        <div style={{ marginTop: 22 }}>
          <button onClick={getData} style={styles.button}>
            Get Data
          </button>
        </div>
      </div>

      {/* REPORT TABLE */}
      {searched && (
        <div style={styles.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <h2 style={{ color: "#0E5EAD", fontSize: 18, fontWeight: 700 }}>
              Bulker Wise Report
            </h2>

            <button
              onClick={exportExcel}
              style={{ ...styles.button, background: "#15803d" }}
            >
              Export Excel
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "space-between",
              flexWrap: "wrap",
              marginBottom: 15,
            }}
          >
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={{ ...styles.input, width: 100 }}
            >
              {[5, 10, 15, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
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
              style={{ ...styles.input, width: 260 }}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 800,
              }}
            >
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
                  ].map((heading) => (
                    <th key={heading} style={styles.th}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map((row, index) => (
                  <tr key={`${row.rfidNo}-${index}`}>
                    <td style={styles.td}>
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td style={styles.td}>WB-{row.wbId}</td>
                    <td style={styles.td}>{row.rfidNo}</td>
                    <td style={styles.td}>{row.truckNo}</td>
                    <td style={styles.td}>
                      {row.weight.toLocaleString("en-IN")}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          color:
                            row.status === "Success"
                              ? "#15803d"
                              : row.status === "Failed"
                              ? "#dc2626"
                              : "#d97706",
                          fontWeight: 700,
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td style={styles.td}>{row.timestamp}</td>
                  </tr>
                ))}

                {paginatedRows.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 30, textAlign: "center" }}>
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 18,
            }}
          >
            <span style={{ fontSize: 13, color: "#64748b" }}>
              Showing {filteredRows.length === 0 ? 0 : (page - 1) * pageSize + 1}
              {" - "}
              {Math.min(page * pageSize, filteredRows.length)}
              {" of "}
              {filteredRows.length} records
            </span>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                style={{
                  ...styles.button,
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                Previous
              </button>

              <span style={{ padding: "10px 12px", fontSize: 13 }}>
                Page {page} / {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                style={{
                  ...styles.button,
                  opacity: page >= totalPages ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

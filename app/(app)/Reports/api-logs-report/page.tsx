
"use client";

import { useMemo, useState } from "react";

type APILogRecord = {
  sno: number;
  requestId: string;
  date: string;
  time: string;
  endpoint: string;
  method: string;
  responseCode: number;
  duration: string;
  status: string;
};

const sampleData: APILogRecord[] = [
  { sno: 1, requestId: "REQ-1001", date: "2026-11-07", time: "09:15:32", endpoint: "/api/vehicle/entry", method: "POST", responseCode: 200, duration: "120 ms", status: "Success" },
  { sno: 2, requestId: "REQ-1002", date: "2026-11-07", time: "09:18:10", endpoint: "/api/rfid/scan", method: "POST", responseCode: 200, duration: "85 ms", status: "Success" },
  { sno: 3, requestId: "REQ-1003", date: "2026-11-06", time: "14:20:45", endpoint: "/api/vehicle/exit", method: "POST", responseCode: 400, duration: "210 ms", status: "Failed" },
  { sno: 4, requestId: "REQ-1004", date: "2026-11-06", time: "16:42:18", endpoint: "/api/weighment", method: "GET", responseCode: 500, duration: "450 ms", status: "Failed" },
  { sno: 5, requestId: "REQ-1005", date: "2026-11-05", time: "11:05:52", endpoint: "/api/vehicle/details", method: "GET", responseCode: 200, duration: "95 ms", status: "Success" },
  { sno: 6, requestId: "REQ-1006", date: "2026-11-05", time: "12:30:15", endpoint: "/api/transaction", method: "POST", responseCode: 200, duration: "150 ms", status: "Success" },
];

export default function APILogsReport() {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [method, setMethod] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const pageSize = 5;

  const filteredData = useMemo(() => {
    const query = search.toLowerCase();

    return sampleData.filter((row) => {
      const matchesSearch =
        row.requestId.toLowerCase().includes(query) ||
        row.endpoint.toLowerCase().includes(query) ||
        row.method.toLowerCase().includes(query) ||
        String(row.responseCode).includes(query);

      return (
        matchesSearch &&
        (!date || row.date === date) &&
        (method === "ALL" || row.method === method) &&
        (status === "ALL" || row.status === status)
      );
    });
  }, [search, date, method, status]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const headers = [
    "SNO",
    "REQUEST ID",
    "DATE",
    "TIME",
    "ENDPOINT",
    "METHOD",
    "RESPONSE CODE",
    "DURATION",
    "STATUS",
  ];

  const exportCSV = () => {
    const csvRows = [
      headers.join(","),
      ...filteredData.map((row) =>
        [
          row.sno,
          row.requestId,
          row.date,
          row.time,
          row.endpoint,
          row.method,
          row.responseCode,
          row.duration,
          row.status,
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "API-Logs-Report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const inputStyle = {
    background: "#1a1a1a",
    color: "#fff",
    border: "1px solid #333",
    borderRadius: 8,
    padding: "10px 12px",
    outline: "none",
  };

  return (
    <div style={{ padding: 24, color: "#fff", background: "#050505", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>API Logs Report</h1>
          <p style={{ color: "#8a8f8d", marginTop: 6 }}>
            Monitor API requests, responses and errors
          </p>
        </div>

        <button
          onClick={exportCSV}
          style={{ background: "#a8e6d9", color: "#050505", padding: "10px 18px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "24px 0" }}>
        <input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setPage(1); }}
          style={inputStyle}
        />

        <select
          value={method}
          onChange={(e) => { setMethod(e.target.value); setPage(1); }}
          style={inputStyle}
        >
          <option value="ALL">All Methods</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          style={inputStyle}
        >
          <option value="ALL">All Status</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
        </select>

        <input
          placeholder="Search request / endpoint..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ ...inputStyle, minWidth: 260 }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "#1a1a1a", border: "1px solid #292929", borderRadius: 12, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
          <thead>
            <tr>
              {headers.map((heading: string) => (
                <th
                  key={heading}
                  style={{ padding: 14, textAlign: "left", color: "#a8e6d9", borderBottom: "1px solid #333", fontSize: 12 }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((row) => (
              <tr key={row.requestId}>
                {[
                  row.sno,
                  row.requestId,
                  row.date,
                  row.time,
                  row.endpoint,
                  row.method,
                  row.responseCode,
                  row.duration,
                  row.status,
                ].map((value, index) => (
                  <td
                    key={index}
                    style={{ padding: 14, borderBottom: "1px solid #292929", fontSize: 13, color: "#cfd4d2" }}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}

            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={headers.length} style={{ padding: 30, textAlign: "center", color: "#8a8f8d" }}>
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, flexWrap: "wrap", gap: 12 }}>
        <span style={{ color: "#8a8f8d", fontSize: 13 }}>
          Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} records
        </span>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
            style={{ ...inputStyle, cursor: "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}
          >
            Previous
          </button>

          <span style={{ padding: "10px 12px", color: "#a8e6d9" }}>
            {currentPage} / {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
            style={{ ...inputStyle, cursor: "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

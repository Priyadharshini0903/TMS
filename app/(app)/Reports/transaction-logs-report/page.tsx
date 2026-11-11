
"use client";

import { useMemo, useState } from "react";

type TransactionRecord = {
  sno: number;
  transactionId: string;
  date: string;
  time: string;
  truckNo: string;
  activity: string;
  message: string;
  status: string;
};

const sampleData: TransactionRecord[] = [
  { sno: 1, transactionId: "TXN-1001", date: "2026-11-07", time: "09:15:32", truckNo: "TN45AB1234", activity: "Gate In", message: "Vehicle entered successfully", status: "Success" },
  { sno: 2, transactionId: "TXN-1002", date: "2026-11-07", time: "09:18:10", truckNo: "TN46CD5678", activity: "RFID Scan", message: "RFID tag detected", status: "Success" },
  { sno: 3, transactionId: "TXN-1003", date: "2026-11-06", time: "14:20:45", truckNo: "KA01XY9876", activity: "Gate Out", message: "Pending vehicle verification", status: "Pending" },
  { sno: 4, transactionId: "TXN-1004", date: "2026-11-06", time: "16:42:18", truckNo: "TN10PQ4567", activity: "Weighment", message: "Weight capture failed", status: "Failed" },
  { sno: 5, transactionId: "TXN-1005", date: "2026-11-05", time: "11:05:52", truckNo: "TN22RS7890", activity: "Gate In", message: "Vehicle entered successfully", status: "Success" },
  { sno: 6, transactionId: "TXN-1006", date: "2026-11-05", time: "12:30:15", truckNo: "TN30UV1122", activity: "Weighment", message: "Gross weight captured", status: "Success" },
];

export default function TransactionLogsReport() {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [activity, setActivity] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const pageSize = 5;

  const filteredData = useMemo(() => {
    const query = search.toLowerCase();

    return sampleData.filter((row) => {
      const matchesSearch =
        row.transactionId.toLowerCase().includes(query) ||
        row.truckNo.toLowerCase().includes(query) ||
        row.message.toLowerCase().includes(query);

      return (
        matchesSearch &&
        (!date || row.date === date) &&
        (activity === "ALL" || row.activity === activity) &&
        (status === "ALL" || row.status === status)
      );
    });
  }, [search, date, activity, status]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const headers = [
    "SNO",
    "TRANSACTION ID",
    "DATE",
    "TIME",
    "TRUCK NO",
    "ACTIVITY",
    "MESSAGE",
    "STATUS",
  ];

  const exportCSV = () => {
    const csvRows = [
      headers.join(","),
      ...filteredData.map((row) =>
        [
          row.sno,
          row.transactionId,
          row.date,
          row.time,
          row.truckNo,
          row.activity,
          row.message,
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
    link.download = "Transaction-Logs-Report.csv";
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
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>Transaction Logs Report</h1>
          <p style={{ color: "#8a8f8d", marginTop: 6 }}>
            View and track gate transaction activities
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
          value={activity}
          onChange={(e) => { setActivity(e.target.value); setPage(1); }}
          style={inputStyle}
        >
          <option value="ALL">All Activities</option>
          <option value="Gate In">Gate In</option>
          <option value="Gate Out">Gate Out</option>
          <option value="RFID Scan">RFID Scan</option>
          <option value="Weighment">Weighment</option>
        </select>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          style={inputStyle}
        >
          <option value="ALL">All Status</option>
          <option value="Success">Success</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>

        <input
          placeholder="Search transaction / truck..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ ...inputStyle, minWidth: 240 }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "#1a1a1a", border: "1px solid #292929", borderRadius: 12, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
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
              <tr key={row.transactionId}>
                {[
                  row.sno,
                  row.transactionId,
                  row.date,
                  row.time,
                  row.truckNo,
                  row.activity,
                  row.message,
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

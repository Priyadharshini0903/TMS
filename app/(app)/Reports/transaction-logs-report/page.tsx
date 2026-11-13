
"use client";

import { useMemo, useState } from "react";

type TransactionRecord = {
  Id: number;
  LoadId: string | null;
  TruckNo: string | null;
  Identifier: string | null;
  TransactionResult: string | null;
  Request: string | null;
  Response: string | null;
  Request_TimeStamp: string | null;
  Response_TimeStamp: string | null;
  TransactionType: string | null;
  TransactionType_II: string | null;
  SourceUser: string | null;
  SourceMachine: string | null;
};

const headers = [
  "SNO",
  "ID",
  "LOAD ID",
  "TRUCK NO",
  "STAGE",
  "STATUS",
  "PAYLOAD",
  "RESPONSE",
  "REQUEST TIMESTAMP",
  "RESPONSE TIMESTAMP",
  "TRANSACTION TYPE",
  "TRANSACTION TYPE II",
  "SOURCE USER",
  "SOURCE MACHINE",
];

export default function TransactionLogsReport() {
  const today = new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [transactionType, setTransactionType] = useState("OUTBOUND");
  const [logType, setLogType] = useState("WEIGHMENT");

  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const showLogType = transactionType !== "INBOUND";

  const inputStyle: React.CSSProperties = {
    background: "#FFFFFF",
    color: "#0F172A",
    border: "1px solid #CBD5E1",
    borderRadius: 8,
    padding: "10px 12px",
    outline: "none",
  };

  const getData = async () => {
    if (!fromDate || !toDate) {
      setError("Please select both dates.");
      return;
    }

    if (fromDate > toDate) {
      setError("From Date cannot be later than To Date.");
      return;
    }

    setLoading(true);
    setError("");
    setRecords([]);
    setPage(1);
    setHasSearched(true);

    try {
      const response = await fetch("/api/reports/transaction-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromDate,
          toDate,
          transactionType,
          logType: showLogType ? logType : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load report.");
      }

      setRecords(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    const query = search.toLowerCase();

    if (!query) return records;

    return records.filter((row) =>
      [
        row.Id,
        row.LoadId,
        row.TruckNo,
        row.Identifier,
        row.TransactionResult,
        row.Request,
        row.Response,
        row.TransactionType,
        row.TransactionType_II,
        row.SourceUser,
        row.SourceMachine,
      ]
        .some((value) =>
          String(value ?? "").toLowerCase().includes(query)
        )
    );
  }, [records, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const exportCSV = () => {
    const csvRows = [
      headers.join(","),
      ...filteredData.map((row, index) =>
        [
          index + 1,
          row.Id,
          row.LoadId,
          row.TruckNo,
          row.Identifier,
          row.TransactionResult,
          row.Request,
          row.Response,
          row.Request_TimeStamp,
          row.Response_TimeStamp,
          row.TransactionType,
          row.TransactionType_II,
          row.SourceUser,
          row.SourceMachine,
        ]
          .map((value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Transaction-Logs-Report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const cellStyle: React.CSSProperties = {
    padding: 13,
    borderBottom: "1px solid #CBD5E1",
    fontSize: 12,
    color: "#334155",
    verticalAlign: "top",
    maxWidth: 350,
    overflowWrap: "anywhere",
  };

  return (
    <div
      style={{
        padding: 24,
        color: "#0F172A",
        background: "#F8FAFC",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>
            Transaction Logs Report
          </h1>

          <p style={{ color: "#64748B", marginTop: 6 }}>
            View and track transaction logs for your plant
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={filteredData.length === 0}
          style={{
            background: "#0E7490",
            color: "#FFFFFF",
            padding: "10px 18px",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
            opacity: filteredData.length === 0 ? 0.4 : 1,
          }}
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          margin: "24px 0",
          alignItems: "end",
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: 7, fontSize: 13 }}>
            From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 7, fontSize: 13 }}>
            To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 7, fontSize: 13 }}>
            Transaction Type
          </label>
          <select
            value={transactionType}
            onChange={(e) => {
              setTransactionType(e.target.value);
              setLogType(
                e.target.value === "OUTBOUND" ? "WEIGHMENT" : "GATE"
              );
            }}
            style={inputStyle}
          >
            <option value="OUTBOUND">OUTBOUND</option>
            <option value="INBOUND">INBOUND</option>
            <option value="AUTO YARD IN">AUTO YARD IN</option>
            <option value="MANUAL YARD IN">MANUAL YARD IN</option>
          </select>
        </div>

        {showLogType && (
          <div>
            <label style={{ display: "block", marginBottom: 7, fontSize: 13 }}>
              Log Type
            </label>
            <select
              value={logType}
              onChange={(e) => setLogType(e.target.value)}
              style={inputStyle}
            >
              <option value="WEIGHMENT">WEIGHMENT LOGS</option>
              <option value="GATE">GATE LOGS</option>
            </select>
          </div>
        )}

        <button
          onClick={getData}
          disabled={loading}
          style={{
            background: "#0E7490",
            color: "#FFFFFF",
            padding: "10px 20px",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Please wait..." : "Get Data"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#FEE2E2",
            color: "#DC2626",
            padding: 14,
            borderRadius: 8,
            marginBottom: 18,
          }}
        >
          {error}
        </div>
      )}

      {/* Search and page size */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <input
          placeholder="Search transaction logs..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ ...inputStyle, minWidth: 250 }}
        />

        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          style={inputStyle}
        >
          <option value={5}>5 records</option>
          <option value={10}>10 records</option>
          <option value={15}>15 records</option>
          <option value={20}>20 records</option>
          <option value={50}>50 records</option>
          <option value={100}>100 records</option>
        </select>
      </div>

      {/* Table */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #CBD5E1",
          borderRadius: 12,
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 1800,
          }}
        >
          <thead>
            <tr>
              {headers.map((heading) => (
                <th
                  key={heading}
                  style={{
                    padding: 14,
                    textAlign: "left",
                    color: "#0E7490",
                    borderBottom: "1px solid #CBD5E1",
                    fontSize: 11,
                    whiteSpace: "nowrap",
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((row, index) => (
              <tr key={`${row.Id}-${index}`}>
                {[
                  (currentPage - 1) * pageSize + index + 1,
                  row.Id,
                  row.LoadId,
                  row.TruckNo,
                  row.Identifier,
                  row.TransactionResult,
                  row.Request,
                  row.Response,
                  row.Request_TimeStamp,
                  row.Response_TimeStamp,
                  row.TransactionType,
                  row.TransactionType_II,
                  row.SourceUser,
                  row.SourceMachine,
                ].map((value, cellIndex) => (
                  <td key={cellIndex} style={cellStyle}>
                    {value ?? "-"}
                  </td>
                ))}
              </tr>
            ))}

            {paginatedData.length === 0 && (
              <tr>
                <td
                  colSpan={headers.length}
                  style={{
                    padding: 30,
                    textAlign: "center",
                    color: "#64748B",
                  }}
                >
                  {loading
                    ? "Loading records..."
                    : hasSearched
                      ? "No records found"
                      : "Select dates and click Get Data"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 18,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span style={{ color: "#64748B", fontSize: 13 }}>
          Showing{" "}
          {filteredData.length === 0
            ? 0
            : (currentPage - 1) * pageSize + 1}
          –{Math.min(currentPage * pageSize, filteredData.length)} of{" "}
          {filteredData.length} records
        </span>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
            style={{
              ...inputStyle,
              cursor: "pointer",
              opacity: currentPage === 1 ? 0.4 : 1,
            }}
          >
            Previous
          </button>

          <span style={{ padding: "10px 12px", color: "#0E7490" }}>
            {currentPage} / {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
            style={{
              ...inputStyle,
              cursor: "pointer",
              opacity: currentPage === totalPages ? 0.4 : 1,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

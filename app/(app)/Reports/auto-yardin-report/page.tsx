"use client";

import { useEffect, useMemo, useState } from "react";

type APILogRecord = {
  FIELD02: string | null;
  SERVICE_IDENTIFIER: string | null;
  RECORD_ID: string | number | null;
  PAYLOAD: string | null;
  RESPONSE: string | null;
  LOGTIME: string | null;
  RESLOGTIME: string | null;
  [key: string]: unknown;
};

type LogLocation = {
  GATESTR: string;
};

const headers = [
  "SNO",
  "STAGE",
  "REQ_ID",
  "PAYLOAD",
  "RESPONSE",
  "REQUEST TIMESTAMP",
  "RESPONSE TIMESTAMP",
];

export default function APILogsReport() {
  const today = new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const [transactionType, setTransactionType] = useState("OUTBOUND");
  const [logType, setLogType] = useState("");

  const [locations, setLocations] = useState<LogLocation[]>([]);
  const [records, setRecords] = useState<APILogRecord[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load gate locations
  useEffect(() => {
    async function loadLocations() {
      try {
        const response = await fetch("/api/reports/api-logs");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load log types.");
        }

        setLocations(result.data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load log types.",
        );
      } finally {
        setDropdownLoading(false);
      }
    }

    loadLocations();
  }, []);

  const showLogType = transactionType === "OUTBOUND";

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
    setSearch("");
    setPage(1);
    setSearched(true);

    try {
      const response = await fetch("/api/reports/api-logs", {
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
        throw new Error(result.error || "Unable to load API logs.");
      }

      setRecords(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return records;

    return records.filter((row) =>
      [
        row.FIELD02,
        row.SERVICE_IDENTIFIER,
        row.RECORD_ID,
        row.PAYLOAD,
        row.RESPONSE,
        row.LOGTIME,
        row.RESLOGTIME,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [records, search]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const exportCSV = () => {
    if (!filteredData.length) {
      alert("No records available to export.");
      return;
    }

    const csvRows = [
      headers,
      ...filteredData.map((row, index) => [
        index + 1,
        row.FIELD02 ?? row.SERVICE_IDENTIFIER ?? "",
        row.RECORD_ID ?? "",
        row.PAYLOAD ?? "",
        row.RESPONSE ?? "",
        row.LOGTIME ?? "",
        row.RESLOGTIME ?? "",
      ]),
    ];

    const csv = csvRows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "API-Logs-Report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const inputStyle: React.CSSProperties = {
    background: "#1a1a1a",
    color: "#fff",
    border: "1px solid #333",
    borderRadius: 8,
    padding: "10px 12px",
    outline: "none",
  };

  const buttonStyle: React.CSSProperties = {
    background: "#a8e6d9",
    color: "#050505",
    padding: "10px 18px",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    border: 0,
  };

  const tdStyle: React.CSSProperties = {
    padding: 14,
    borderBottom: "1px solid #292929",
    fontSize: 13,
    color: "#cfd4d2",
    verticalAlign: "top",
  };

  return (
    <div
      style={{
        padding: 24,
        color: "#fff",
        background: "#050505",
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
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>API Logs Report</h1>

          <p style={{ color: "#8a8f8d", marginTop: 6 }}>
            Monitor API requests, responses and transaction logs
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={!filteredData.length}
          style={{
            ...buttonStyle,
            opacity: filteredData.length ? 1 : 0.5,
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
            From Date *
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
            To Date *
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
            Transaction Type *
          </label>

          <select
            value={transactionType}
            onChange={(e) => {
              setTransactionType(e.target.value);
              setLogType("");
            }}
            style={inputStyle}
          >
            <option value="OUTBOUND">OUTBOUND</option>
            <option value="INBOUND">INBOUND</option>
          </select>
        </div>

        {showLogType && (
          <div>
            <label style={{ display: "block", marginBottom: 7, fontSize: 13 }}>
              Log Type *
            </label>

            <select
              value={logType}
              onChange={(e) => setLogType(e.target.value)}
              style={inputStyle}
              disabled={dropdownLoading}
            >
              <option value="">ALL LOCATION LOG</option>
              <option value="SAP">SAP LOGS</option>

              {locations.map((location, index) => (
                <option
                  key={`${location.GATESTR}-${index}`}
                  value={location.GATESTR}
                >
                  {location.GATESTR}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={getData}
          disabled={loading || dropdownLoading}
          style={{
            ...buttonStyle,
            opacity: loading || dropdownLoading ? 0.6 : 1,
          }}
        >
          {loading ? "Please wait..." : "Get Data"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#401c1c",
            color: "#ff9999",
            padding: 14,
            borderRadius: 8,
            marginBottom: 18,
          }}
        >
          {error}
        </div>
      )}

      {/* Report */}
      {searched && (
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #292929",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <h2 style={{ fontSize: 17, color: "#a8e6d9", fontWeight: 700 }}>
              Report Details
            </h2>

            <span style={{ color: "#8a8f8d", fontSize: 13 }}>
              Total Records: {filteredData.length}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={inputStyle}
            >
              {[5, 10, 15, 20, 50, 70, 100, 5000].map((size) => (
                <option key={size} value={size}>
                  {size === 5000 ? "ALL" : size}
                </option>
              ))}
            </select>

            <input
              placeholder="Search stage / request / payload..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ ...inputStyle, minWidth: 260 }}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 1400,
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
                        color: "#a8e6d9",
                        borderBottom: "1px solid #333",
                        fontSize: 12,
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
                  <tr key={`${row.RECORD_ID}-${index}`}>
                    <td style={tdStyle}>
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>

                    <td style={tdStyle}>
                      {row.FIELD02 ?? row.SERVICE_IDENTIFIER ?? "-"}
                    </td>

                    <td style={tdStyle}>{row.RECORD_ID ?? "-"}</td>

                    <td
                      style={{
                        ...tdStyle,
                        minWidth: 350,
                        maxWidth: 500,
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {row.PAYLOAD ?? "-"}
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        minWidth: 350,
                        maxWidth: 500,
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {row.RESPONSE ?? "-"}
                    </td>

                    <td style={tdStyle}>{row.LOGTIME ?? "-"}</td>
                    <td style={tdStyle}>{row.RESLOGTIME ?? "-"}</td>
                  </tr>
                ))}

                {paginatedData.length === 0 && (
                  <tr>
                    <td
                      colSpan={headers.length}
                      style={{
                        padding: 30,
                        textAlign: "center",
                        color: "#8a8f8d",
                      }}
                    >
                      {loading ? "Loading..." : "No records found"}
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
            <span style={{ color: "#8a8f8d", fontSize: 13 }}>
              Showing{" "}
              {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              –{Math.min(currentPage * pageSize, filteredData.length)} of{" "}
              {filteredData.length} records
            </span>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                style={{
                  ...buttonStyle,
                  opacity: currentPage === 1 ? 0.4 : 1,
                }}
              >
                Previous
              </button>

              <span style={{ padding: "10px 12px", color: "#a8e6d9" }}>
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
                style={{
                  ...buttonStyle,
                  opacity: currentPage === totalPages ? 0.4 : 1,
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


"use client";

import { useMemo, useState } from "react";

type RFIDRecord = {
  ID: number;
  gateLoc: string;
  trucksCount: number;
};

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function RFIDSenseReport() {
  const [fromDate, setFromDate] = useState(getToday);
  const [toDate, setToDate] = useState(getToday);

  const [rows, setRows] = useState<RFIDRecord[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const pageSize = 5;

  const filteredData = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return rows;

    return rows.filter(
      (row) =>
        String(row.ID).includes(query) ||
        String(row.gateLoc || "").toLowerCase().includes(query) ||
        String(row.trucksCount).includes(query)
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalTrucks = rows.reduce(
    (total, row) => total + Number(row.trucksCount || 0),
    0
  );

  async function getData() {
    setError("");

    if (!fromDate || !toDate) {
      setError("Please select both From Date and To Date.");
      return;
    }

    if (fromDate > toDate) {
      setError("From Date cannot be later than To Date.");
      return;
    }

    setLoading(true);
    setSearched(false);

    try {
      const response = await fetch("/api/reports/rfid-sense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromDate,
          toDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to generate report.");
      }

      setRows(result.data || []);
      setSearch("");
      setPage(1);
      setSearched(true);
    } catch (err) {
      setRows([]);
      setSearched(true);
      setError(
        err instanceof Error ? err.message : "Unable to generate report."
      );
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!filteredData.length) {
      alert("No records available to export.");
      return;
    }

    const headers = ["SNO", "STAGE", "NO. OF TRUCKS"];

    const csvRows = [
      headers,
      ...filteredData.map((row, index) => [
        index + 1,
        row.gateLoc,
        row.trucksCount,
      ]),
      ["", "TOTAL", totalTrucks],
    ];

    const csv = csvRows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "RFID-Sense-Report.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  const inputStyle: React.CSSProperties = {
    background: "#1a1a1a",
    color: "#fff",
    border: "1px solid #333",
    borderRadius: 8,
    padding: "10px 12px",
    outline: "none",
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
            RFID Sense Report
          </h1>
          <p style={{ color: "#8a8f8d", marginTop: 6 }}>
            RFID sensed trucks summary by stage
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={!searched || filteredData.length === 0}
          style={{
            background: "#a8e6d9",
            color: "#050505",
            padding: "10px 18px",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
            opacity: !searched || filteredData.length === 0 ? 0.5 : 1,
          }}
        >
          Export CSV
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          margin: "24px 0",
          alignItems: "center",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              color: "#a8e6d9",
              fontSize: 12,
              marginBottom: 6,
            }}
          >
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
          <label
            style={{
              display: "block",
              color: "#a8e6d9",
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            To Date
          </label>
          <input
            type="date"
            value={toDate}
            min={fromDate}
            onChange={(e) => setToDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        <button
          onClick={getData}
          disabled={loading}
          style={{
            ...inputStyle,
            background: "#a8e6d9",
            color: "#050505",
            fontWeight: 600,
            cursor: "pointer",
            marginTop: 19,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Please wait..." : "Get Data"}
        </button>

        <input
          placeholder="Search stage..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            ...inputStyle,
            minWidth: 220,
            marginTop: 19,
          }}
        />
      </div>

      {error && (
        <p style={{ color: "#f87171", marginBottom: 16 }}>{error}</p>
      )}

      {searched && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <span style={{ color: "#8a8f8d", fontSize: 13 }}>
              From: {fromDate} &nbsp; To: {toDate}
            </span>

            <span style={{ color: "#a8e6d9", fontWeight: 700 }}>
              Total Trucks: {totalTrucks.toLocaleString("en-IN")}
            </span>
          </div>

          <div
            style={{
              background: "#1a1a1a",
              border: "1px solid #292929",
              borderRadius: 12,
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 600,
              }}
            >
              <thead>
                <tr>
                  {["SNO", "STAGE", "NO. OF TRUCKS"].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: 14,
                        textAlign: "left",
                        color: "#a8e6d9",
                        borderBottom: "1px solid #333",
                        fontSize: 12,
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginatedData.map((row, index) => (
                  <tr key={`${row.ID}-${index}`}>
                    <td
                      style={{
                        padding: 14,
                        borderBottom: "1px solid #292929",
                        fontSize: 13,
                        color: "#cfd4d2",
                      }}
                    >
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>

                    <td
                      style={{
                        padding: 14,
                        borderBottom: "1px solid #292929",
                        fontSize: 13,
                        color: "#cfd4d2",
                      }}
                    >
                      {row.gateLoc || `Stage ${row.ID}`}
                    </td>

                    <td
                      style={{
                        padding: 14,
                        borderBottom: "1px solid #292929",
                        fontSize: 13,
                        color: "#cfd4d2",
                      }}
                    >
                      {Number(row.trucksCount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}

                {paginatedData.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      style={{
                        padding: 30,
                        textAlign: "center",
                        color: "#8a8f8d",
                      }}
                    >
                      No records found.
                    </td>
                  </tr>
                )}

                {filteredData.length > 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      style={{
                        padding: 14,
                        textAlign: "right",
                        fontWeight: 700,
                        color: "#a8e6d9",
                      }}
                    >
                      TOTAL
                    </td>
                    <td
                      style={{
                        padding: 14,
                        fontWeight: 700,
                        color: "#a8e6d9",
                      }}
                    >
                      {filteredData
                        .reduce(
                          (sum, row) => sum + Number(row.trucksCount || 0),
                          0
                        )
                        .toLocaleString("en-IN")}
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
              marginTop: 18,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span style={{ color: "#8a8f8d", fontSize: 13 }}>
              Showing{" "}
              {filteredData.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
              –{Math.min(currentPage * pageSize, filteredData.length)} of{" "}
              {filteredData.length} stages
            </span>

            <div style={{ display: "flex", gap: 8 }}>
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

              <span style={{ padding: "10px 12px", color: "#a8e6d9" }}>
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
        </>
      )}
    </div>
  );
}

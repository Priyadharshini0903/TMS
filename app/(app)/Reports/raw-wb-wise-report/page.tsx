
"use client";

import { useEffect, useMemo, useState } from "react";

type Weighbridge = {
  WBID: number;
  LOCNAME: string;
};

type RawWBRecord = {
  WBID: number;
  RFNO: string | null;
  TRUCKNO: string | null;
  WEIGHT: string | number | null;
  STATUS: string | null;
  DatTim: string;
};

export default function RawWBWiseReport() {
  const [bulkWeighbridges, setBulkWeighbridges] = useState<Weighbridge[]>([]);
  const [rows, setRows] = useState<RawWBRecord[]>([]);

  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [weighbridge, setWeighbridge] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pageSize = 5;

  useEffect(() => {
    async function loadWeighbridges() {
      try {
        const response = await fetch("/api/reports/raw-wb-wise", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load weighbridges.");
        }

        setBulkWeighbridges(result.data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load weighbridges."
        );
      }
    }

    loadWeighbridges();
  }, []);

  async function getData() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/reports/raw-wb-wise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          weighbridge,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load report.");
      }

      setRows(result.data || []);
      setPage(1);
    } catch (err) {
      setRows([]);
      setError(
        err instanceof Error ? err.message : "Unable to load report."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredData = useMemo(() => {
    const term = search.toLowerCase().trim();

    return rows.filter((row) => {
      const matchesSearch =
        String(row.TRUCKNO || "").toLowerCase().includes(term) ||
        String(row.RFNO || "").toLowerCase().includes(term) ||
        String(row.STATUS || "").toLowerCase().includes(term) ||
        String(row.WEIGHT || "").toLowerCase().includes(term);

      const statusText = String(row.STATUS || "").toLowerCase();

      const matchesStatus =
        status === "ALL" ||
        (status === "Success" && statusText.includes("success")) ||
        (status === "Pending" && statusText.includes("pending")) ||
        (status === "Failed" &&
          !statusText.includes("success") &&
          !statusText.includes("pending"));

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, status]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const headers = [
    "SNO",
    "DATE",
    "WEIGHBRIDGE",
    "TRUCK NO",
    "RFID NO",
    "RAW RFID DATA",
    "WEIGHT",
    "STATUS",
  ];

  const exportCSV = () => {
    if (!filteredData.length) {
      alert("No records available to export.");
      return;
    }

    const csvRows = [
      headers.map((value) => `"${value}"`).join(","),
      ...filteredData.map((row, index) =>
        [
          index + 1,
          row.DatTim,
          `WB${row.WBID}`,
          row.TRUCKNO || "",
          row.RFNO || "",
          row.RFNO || "",
          row.WEIGHT || "",
          row.STATUS || "",
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Raw-WB-Wise-Report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const inputStyle: React.CSSProperties = {
    background: "#FFFFFF",
    color: "#0F172A",
    border: "1px solid #CBD5E1",
    borderRadius: 8,
    padding: "10px 12px",
    outline: "none",
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
            Raw WB Wise Report
          </h1>
          <p style={{ color: "#64748B", marginTop: 6 }}>
            Raw RFID data by weighbridge
          </p>
        </div>

        <button
          onClick={exportCSV}
          style={{
            background: "#0E7490",
            color: "#FFFFFF",
            padding: "10px 18px",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
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
        }}
      >
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setPage(1);
          }}
          style={inputStyle}
        />

        <select
          value={weighbridge}
          onChange={(e) => {
            setWeighbridge(e.target.value);
            setPage(1);
          }}
          style={inputStyle}
        >
          <option value="ALL">All Weighbridges</option>
          {bulkWeighbridges.map((item) => (
            <option key={item.WBID} value={String(item.WBID)}>
              {item.LOCNAME || `WB${item.WBID}`}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          style={inputStyle}
        >
          <option value="ALL">All Status</option>
          <option value="Success">Success</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Other / Failed</option>
        </select>

        <input
          placeholder="Search truck / RFID..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ ...inputStyle, minWidth: 220 }}
        />

        <button
          onClick={getData}
          disabled={loading}
          style={{
            ...inputStyle,
            background: "#0E7490",
            color: "#FFFFFF",
            fontWeight: 600,
            cursor: "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Loading..." : "Get Data"}
        </button>
      </div>

      {error && (
        <p style={{ color: "#DC2626", marginBottom: 16 }}>{error}</p>
      )}

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
            minWidth: 1000,
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
              <tr key={`${row.WBID}-${row.RFNO}-${index}`}>
                {[
                  (currentPage - 1) * pageSize + index + 1,
                  row.DatTim,
                  `WB${row.WBID}`,
                  row.TRUCKNO || "-",
                  row.RFNO || "-",
                  row.RFNO || "-",
                  row.WEIGHT ?? "-",
                  row.STATUS || "-",
                ].map((value, cellIndex) => (
                  <td
                    key={cellIndex}
                    style={{
                      padding: 14,
                      borderBottom: "1px solid #CBD5E1",
                      fontSize: 13,
                      color: "#334155",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {value}
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
                  {rows.length === 0
                    ? "Select filters and click Get Data."
                    : "No records found."}
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
        <span style={{ color: "#64748B", fontSize: 13 }}>
          Showing{" "}
          {filteredData.length === 0
            ? 0
            : (currentPage - 1) * pageSize + 1}
          –{Math.min(currentPage * pageSize, filteredData.length)} of{" "}
          {filteredData.length} records
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

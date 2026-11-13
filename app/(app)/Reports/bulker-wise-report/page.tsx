
"use client";

import { useEffect, useMemo, useState } from "react";

type BulkerConfig = {
  WBID: number;
  ITEMNAME: string;
};

type ReportRow = {
  WBID: number;
  RFNO: string | null;
  TRUCKNO: string | null;
  WEIGHT: string | number | null;
  STATUS: string | null;
  DatTim: string;
};

export default function BulkerWiseReportPage() {
  const [reportType, setReportType] = useState<"date" | "truck" | "">("");
  const [selectedDate, setSelectedDate] = useState("");
  const [weighbridge, setWeighbridge] = useState("ALL");
  const [truckNo, setTruckNo] = useState("");

  const [bulkers, setBulkers] = useState<BulkerConfig[]>([]);
  const [rows, setRows] = useState<ReportRow[]>([]);

  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function loadBulkers() {
      try {
        const response = await fetch(
          "/api/reports/bulker-wise?action=bulkers",
          { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load weighbridges.");
        }

        setBulkers(result.data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load weighbridges."
        );
      }
    }

    loadBulkers();
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return rows;

    return rows.filter((row) =>
      [
        row.WBID,
        row.RFNO,
        row.TRUCKNO,
        row.WEIGHT,
        row.STATUS,
        row.DatTim,
      ].some((value) => String(value ?? "").toLowerCase().includes(term))
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const paginatedRows = filteredRows.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  async function getData() {
    setError("");

    if (!reportType) {
      setError("Please select a report type.");
      return;
    }

    if (reportType === "date" && !selectedDate) {
      setError("Please select a date.");
      return;
    }

    if (reportType === "truck" && !truckNo.trim()) {
      setError("Please enter the truck number.");
      return;
    }

    setLoading(true);
    setSearched(false);

    try {
      const response = await fetch("/api/reports/bulker-wise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType,
          selectedDate,
          weighbridge,
          truckNo,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to generate report.");
      }

      setRows(result.data || []);
      setSearched(true);
      setSearch("");
      setPage(1);
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
      `WB-${row.WBID}`,
      row.RFNO ?? "",
      row.TRUCKNO ?? "",
      row.WEIGHT ?? "",
      row.STATUS ?? "",
      row.DatTim ?? "",
    ]);

    const csv = [headers, ...csvRows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
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
      background: "#0E7490",
      color: "#0F172A",
      cursor: "pointer",
      fontWeight: 600,
    },
    th: {
      background: "#0E7490",
      color: "#0F172A",
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
      color: "#334155",
    },
  };

  return (
    <div style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <div
        style={{
          background: "#0E7490",
          color: "#0F172A",
          padding: "15px 20px",
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>
          BULKER WISE REPORT
        </h1>
      </div>

      <div style={styles.card}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={reportType === "date"}
              onChange={() => {
                setReportType(reportType === "date" ? "" : "date");
                setSearched(false);
                setRows([]);
                setError("");
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
                setRows([]);
                setError("");
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
                {bulkers.map((item) => (
                  <option key={item.WBID} value={String(item.WBID)}>
                    {item.ITEMNAME || `WB-${item.WBID}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {reportType === "truck" && (
          <div style={{ marginTop: 22, maxWidth: 400 }}>
            <label style={styles.label}>Enter the Truck No *</label>
            <input
              type="text"
              placeholder="Eg: OD04Z2867"
              value={truckNo}
              onChange={(e) => setTruckNo(e.target.value)}
              style={styles.input}
            />
          </div>
        )}

        <div style={{ marginTop: 22 }}>
          <button
            onClick={getData}
            disabled={loading}
            style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Loading..." : "Get Data"}
          </button>
        </div>

        {error && (
          <p style={{ color: "#dc2626", marginTop: 14, fontSize: 14 }}>
            {error}
          </p>
        )}
      </div>

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
            <h2 style={{ color: "#0E7490", fontSize: 18, fontWeight: 700 }}>
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
                  <tr key={`${row.WBID}-${row.RFNO}-${index}`}>
                    <td style={styles.td}>
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td style={styles.td}>WB-{row.WBID}</td>
                    <td style={styles.td}>{row.RFNO || "-"}</td>
                    <td style={styles.td}>{row.TRUCKNO || "-"}</td>
                    <td style={styles.td}>
                      {Number(row.WEIGHT || 0).toLocaleString("en-IN")}
                    </td>
                    <td style={styles.td}>{row.STATUS || "-"}</td>
                    <td style={styles.td}>
                      {row.DatTim
                        ? new Date(row.DatTim).toLocaleString("en-IN")
                        : "-"}
                    </td>
                  </tr>
                ))}

                {paginatedRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ padding: 30, textAlign: "center" }}
                    >
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
              Showing{" "}
              {filteredRows.length === 0 ? 0 : (page - 1) * pageSize + 1}
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


"use client";

import { useEffect, useMemo, useState } from "react";

type WeighbridgeOption = {
  WBID: number;
  LOCNAME: string;
};

type ReportRow = {
  WBID: number;
  RFNO: string | null;
  TRUCKNO: string | null;
  WEIGHT: number | null;
  STATUS: string | null;
  DatTim: string | null;
  Center_Position: string | null;
  RfCard_Detect: string | null;
  EligibleSend: string | null;
  EligibleReply: string | null;
  StableCnt_Start: string | null;
  StableCnt_End: string | null;
  WeightService_Send: string | null;
  WeighService_End: string | null;
  TimeDifferenceFormatted: string | null;
};

const headers = [
  "SNO",
  "WEIGHBRIDGE",
  "RFID NO",
  "TRUCK NO",
  "WEIGHT",
  "STATUS",
  "RESPONSE TIMESTAMP",
  "CENTER POSITION",
  "RF CARD DETECT",
  "ELIGIBLE SEND",
  "ELIGIBLE REPLY",
  "STABLE COUNT START",
  "STABLE COUNT END",
  "WEIGHT SERVICE SEND",
  "WEIGH SERVICE END",
  "TIME DIFFERENCE",
];

export default function WbWiseReportPage() {
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [weighbridges, setWeighbridges] = useState<WeighbridgeOption[]>([]);
  const [weighbridge, setWeighbridge] = useState("ALL");

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [searched, setSearched] = useState(false);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWeighbridges() {
      try {
        const response = await fetch("/api/reports/wb-wise");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load weighbridges.");
        }

        setWeighbridges(result.data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load weighbridges."
        );
      } finally {
        setDropdownLoading(false);
      }
    }

    loadWeighbridges();
  }, []);

  const getData = async () => {
    if (!date || !weighbridge) {
      setError("Please select a date and weighbridge.");
      return;
    }

    setLoading(true);
    setError("");
    setRows([]);
    setSearch("");
    setPage(1);
    setSearched(true);

    try {
      const response = await fetch("/api/reports/wb-wise", {
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
        throw new Error(result.error || "Unable to generate report.");
      }

      setRows(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const query = search.toLowerCase();

    if (!query) return rows;

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      )
    );
  }, [rows, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function exportExcel() {
    if (!filteredRows.length) {
      alert("No records available to export.");
      return;
    }

    const csvRows = [
      headers,
      ...filteredRows.map((row, index) => [
        index + 1,
        `WB-${row.WBID}`,
        row.RFNO,
        row.TRUCKNO,
        row.WEIGHT,
        row.STATUS,
        row.DatTim,
        row.Center_Position,
        row.RfCard_Detect,
        row.EligibleSend,
        row.EligibleReply,
        row.StableCnt_Start,
        row.StableCnt_End,
        row.WeightService_Send,
        row.WeighService_End,
        row.TimeDifferenceFormatted,
      ]),
    ];

    const csv = csvRows
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "WBWiseReport.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  const card: React.CSSProperties = {
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  };

  const input: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #CBD5E1",
    borderRadius: 6,
    background: "#F1F5F9",
    color: "#0F172A",
    fontSize: 14,
  };

  const button: React.CSSProperties = {
    padding: "10px 18px",
    border: 0,
    borderRadius: 6,
    background: "#0E7490",
    color: "#FFFFFF",
    cursor: "pointer",
    fontWeight: 700,
  };

  const th: React.CSSProperties = {
    padding: 12,
    background: "#F1F5F9",
    color: "#0E7490",
    textAlign: "center",
    fontSize: 12,
    whiteSpace: "nowrap",
    borderBottom: "1px solid #CBD5E1",
  };

  const td: React.CSSProperties = {
    padding: 12,
    textAlign: "center",
    fontSize: 12,
    color: "#0F172A",
    borderBottom: "1px solid #CBD5E1",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        padding: 24,
        background: "#F8FAFC",
        minHeight: "100vh",
        color: "#0F172A",
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#0E7490",
          marginBottom: 24,
        }}
      >
        WB WISE REPORT
      </h1>

      {/* Filters */}
      <div style={card}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 20,
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                color: "#334155",
                fontSize: 13,
              }}
            >
              Select Date *
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={input}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                color: "#334155",
                fontSize: 13,
              }}
            >
              Weighbridge *
            </label>

            <select
              value={weighbridge}
              onChange={(e) => setWeighbridge(e.target.value)}
              style={input}
              disabled={dropdownLoading}
            >
              <option value="ALL">ALL</option>

              {weighbridges.map((wb) => (
                <option key={wb.WBID} value={wb.WBID}>
                  {wb.LOCNAME}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={getData}
          disabled={loading || dropdownLoading}
          style={{
            ...button,
            marginTop: 22,
            opacity: loading || dropdownLoading ? 0.6 : 1,
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

      {/* Report */}
      {searched && (
        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontSize: 17,
                color: "#0E7490",
                fontWeight: 700,
              }}
            >
              Report Details
            </h2>

            <button
              onClick={exportExcel}
              disabled={!filteredRows.length}
              style={{
                ...button,
                opacity: filteredRows.length ? 1 : 0.5,
              }}
            >
              Export Excel
            </button>
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
              style={{ ...input, width: 110 }}
            >
              {[5, 10, 15, 20, 50, 70, 100].map((size) => (
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
              style={{ ...input, width: 260 }}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
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
                    <th key={heading} style={th}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map((row, index) => (
                  <tr key={`${row.WBID}-${row.DatTim}-${index}`}>
                    <td style={td}>
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td style={td}>WB-{row.WBID}</td>
                    <td style={td}>{row.RFNO ?? "-"}</td>
                    <td style={td}>{row.TRUCKNO ?? "-"}</td>
                    <td style={td}>
                      {row.WEIGHT == null
                        ? "-"
                        : Number(row.WEIGHT).toLocaleString("en-IN")}
                    </td>
                    <td style={td}>{row.STATUS ?? "-"}</td>
                    <td style={td}>{row.DatTim ?? "-"}</td>
                    <td style={td}>{row.Center_Position ?? "-"}</td>
                    <td style={td}>{row.RfCard_Detect ?? "-"}</td>
                    <td style={td}>{row.EligibleSend ?? "-"}</td>
                    <td style={td}>{row.EligibleReply ?? "-"}</td>
                    <td style={td}>{row.StableCnt_Start ?? "-"}</td>
                    <td style={td}>{row.StableCnt_End ?? "-"}</td>
                    <td style={td}>{row.WeightService_Send ?? "-"}</td>
                    <td style={td}>{row.WeighService_End ?? "-"}</td>
                    <td style={td}>
                      {row.TimeDifferenceFormatted ?? "-"}
                    </td>
                  </tr>
                ))}

                {paginatedRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={headers.length}
                      style={{ ...td, padding: 30 }}
                    >
                      {loading ? "Loading..." : "No records found."}
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
              marginTop: 20,
            }}
          >
            <span style={{ color: "#64748B", fontSize: 13 }}>
              Showing{" "}
              {filteredRows.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
              {" - "}
              {Math.min(currentPage * pageSize, filteredRows.length)} of{" "}
              {filteredRows.length} records
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <button
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                style={{
                  ...button,
                  opacity: currentPage === 1 ? 0.4 : 1,
                }}
              >
                Previous
              </button>

              <span style={{ color: "#334155", fontSize: 13 }}>
                Page {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                style={{
                  ...button,
                  opacity: currentPage >= totalPages ? 0.4 : 1,
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

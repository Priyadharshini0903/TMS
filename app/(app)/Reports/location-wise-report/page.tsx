
"use client";

import { useEffect, useMemo, useState } from "react";

type Location = {
  SID: number;
  LOCNAME: string;
};

type ReportRow = {
  LOCSTR?: string;
  RFNO?: string;
  TRUCKNO?: string;
  STATUS?: string;
  DatTim?: string;
};

type SearchType = "DateWithLoc" | "TruckOnly";

export default function LocationWiseReportPage() {
  const [searchType, setSearchType] = useState<SearchType>("DateWithLoc");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState("ALL");
  const [truckNo, setTruckNo] = useState("");

  const [locations, setLocations] = useState<Location[]>([]);
  const [rows, setRows] = useState<ReportRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    async function loadLocations() {
      try {
        const response = await fetch(
          "/api/reports/location-wise?action=locations",
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load locations");
        }

        setLocations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load locations");
      } finally {
        setLocationsLoading(false);
      }
    }

    loadLocations();
  }, []);

  async function getData() {
    setError("");

    if (searchType === "DateWithLoc") {
      if (!date) {
        setError("Please select a date.");
        return;
      }

      if (location === "ALL") {
        setError("Please select a location.");
        return;
      }
    }

    if (searchType === "TruckOnly" && !truckNo.trim()) {
      setError("Please enter the truck number.");
      return;
    }

    setLoading(true);
    setSearched(true);
    setPage(1);
    setSearch("");

    try {
      const params = new URLSearchParams();

      if (searchType === "DateWithLoc") {
        params.set("date", date);
        params.set("location", location);
      } else {
        params.set("truckNo", truckNo.trim());
      }

      const response = await fetch(
        `/api/reports/location-wise?${params.toString()}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load report");
      }

      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Unable to load report");
    } finally {
      setLoading(false);
    }
  }

  const filteredRows = useMemo(() => {
    const keyword = search.toLowerCase();

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "").toLowerCase().includes(keyword)
      )
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const paginatedRows = filteredRows.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  function formatDate(value?: string) {
    if (!value) return "—";

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleString("en-IN");
  }

  function exportExcel() {
    if (!filteredRows.length) {
      alert("No records available to export.");
      return;
    }

    const headers = ["SNO", "LOCATION", "RFID NO", "TRUCK NO", "STATUS", "DATE TIME"];

    const csvRows = filteredRows.map((row, index) => [
      index + 1,
      row.LOCSTR,
      row.RFNO,
      row.TRUCKNO,
      row.STATUS,
      row.DatTim,
    ]);

    const csv = [headers, ...csvRows]
      .map((row) =>
        row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "LocationWiseReport.csv";
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
    background: "#111",
    color: "#fff",
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
    color: "#fff",
    borderBottom: "1px solid #303030",
    whiteSpace: "nowrap",
  };

  return (
    <main style={{ padding: 24, background: "#050505", minHeight: "100vh", color: "#fff" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#a8e6d9", marginBottom: 24 }}>
        LOCATION WISE REPORT
      </h1>

      <section style={card}>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap", marginBottom: 22 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
            <input
              type="radio"
              checked={searchType === "DateWithLoc"}
              onChange={() => setSearchType("DateWithLoc")}
            />
            Location with Datewise
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
            <input
              type="radio"
              checked={searchType === "TruckOnly"}
              onChange={() => setSearchType("TruckOnly")}
            />
            Truck No Only
          </label>
        </div>

        {searchType === "DateWithLoc" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13 }}>
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
              <label style={{ display: "block", marginBottom: 8, fontSize: 13 }}>
                Location *
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={input}
                disabled={locationsLoading}
              >
                <option value="ALL">
                  {locationsLoading ? "Loading locations..." : "Select Location"}
                </option>
                {locations.map((item) => (
                  <option key={item.SID} value={item.SID}>
                    {item.LOCNAME}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 450 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13 }}>
              Enter Truck Number *
            </label>
            <input
              value={truckNo}
              onChange={(e) => setTruckNo(e.target.value)}
              placeholder="Enter truck number"
              style={input}
            />
          </div>
        )}

        <button onClick={getData} disabled={loading} style={{ ...button, marginTop: 22, opacity: loading ? 0.6 : 1 }}>
          {loading ? "Loading..." : "Get Data"}
        </button>

        {error && (
          <p style={{ color: "#f87171", marginTop: 15, fontSize: 13 }}>
            {error}
          </p>
        )}
      </section>

      {searched && (
        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <h2 style={{ color: "#a8e6d9", fontWeight: 700 }}>Report Details</h2>
            <button onClick={exportExcel} style={button}>Export Excel</button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              style={{ ...input, width: 100 }}
            >
              {[5, 10, 15, 20, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>

            <input
              placeholder="Search report..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ ...input, width: 260 }}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 850 }}>
              <thead>
                <tr>
                  {["SNO", "LOCATION", "RFID NO", "TRUCK NO", "STATUS", "DATE TIME"].map((heading) => (
                    <th key={heading} style={th}>{heading}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ ...td, padding: 30 }}>Loading report...</td></tr>
                ) : paginatedRows.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...td, padding: 30 }}>No records found.</td></tr>
                ) : (
                  paginatedRows.map((row, index) => (
                    <tr key={`${row.RFNO ?? "record"}-${index}`}>
                      <td style={td}>{(page - 1) * pageSize + index + 1}</td>
                      <td style={td}>{row.LOCSTR || "—"}</td>
                      <td style={td}>{row.RFNO || "—"}</td>
                      <td style={td}>{row.TRUCKNO || "—"}</td>
                      <td style={td}>{row.STATUS || "—"}</td>
                      <td style={td}>{formatDate(row.DatTim)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            <span style={{ color: "#8a8f8d", fontSize: 13 }}>
              Showing {filteredRows.length ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length} records
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button disabled={page === 1} onClick={() => setPage(page - 1)} style={{ ...button, opacity: page === 1 ? 0.4 : 1 }}>
                Previous
              </button>
              <span style={{ fontSize: 13 }}>Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ ...button, opacity: page >= totalPages ? 0.4 : 1 }}>
                Next
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

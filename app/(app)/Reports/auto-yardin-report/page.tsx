
"use client";

import { useMemo, useState } from "react";

type YardRecord = {
  sno: number;
  date: string;
  time: string;
  truckNo: string;
  rfidNo: string;
  location: string;
  event: string;
  status: string;
};

const sampleData: YardRecord[] = [
  { sno: 1, date: "2026-11-07", time: "09:15:32", truckNo: "TN45AB1234", rfidNo: "E2000017221101441890ABCD", location: "Yard-01", event: "Vehicle Entered Yard", status: "Success" },
  { sno: 2, date: "2026-11-07", time: "09:18:10", truckNo: "TN46CD5678", rfidNo: "E2000017221101441890EFGH", location: "Yard-02", event: "Vehicle Assigned", status: "Success" },
  { sno: 3, date: "2026-11-06", time: "14:20:45", truckNo: "KA01XY9876", rfidNo: "E2000017221101441890IJKL", location: "Yard-01", event: "Waiting for Loading", status: "Pending" },
  { sno: 4, date: "2026-11-06", time: "16:42:18", truckNo: "TN10PQ4567", rfidNo: "E2000017221101441890MNOP", location: "Yard-03", event: "Yard Exit", status: "Success" },
  { sno: 5, date: "2026-11-05", time: "11:05:52", truckNo: "TN22RS7890", rfidNo: "E2000017221101441890QRST", location: "Yard-02", event: "Vehicle Entered Yard", status: "Failed" },
];

export default function AutoYardinReport() {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const pageSize = 5;

  const filteredData = useMemo(() => {
    const query = search.toLowerCase();

    return sampleData.filter((row) => {
      const matchesSearch =
        row.truckNo.toLowerCase().includes(query) ||
        row.rfidNo.toLowerCase().includes(query) ||
        row.event.toLowerCase().includes(query);

      return (
        matchesSearch &&
        (!date || row.date === date) &&
        (location === "ALL" || row.location === location) &&
        (status === "ALL" || row.status === status)
      );
    });
  }, [search, date, location, status]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const headers = [
    "SNO",
    "DATE",
    "TIME",
    "TRUCK NO",
    "RFID NO",
    "LOCATION",
    "EVENT",
    "STATUS",
  ];

  const exportCSV = () => {
    const csvRows = [
      headers.join(","),
      ...filteredData.map((row) =>
        [
          row.sno,
          row.date,
          row.time,
          row.truckNo,
          row.rfidNo,
          row.location,
          row.event,
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
    link.download = "Auto-Yardin-Report.csv";
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>Auto Yardin Report</h1>
          <p style={{ color: "#8a8f8d", marginTop: 6 }}>
            Monitor automatic vehicle yard movements
          </p>
        </div>

        <button
          onClick={exportCSV}
          style={{ background: "#a8e6d9", color: "#050505", padding: "10px 18px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
        >
          Export CSV
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "24px 0" }}>
        <input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setPage(1); }}
          style={inputStyle}
        />

        <select
          value={location}
          onChange={(e) => { setLocation(e.target.value); setPage(1); }}
          style={inputStyle}
        >
          <option value="ALL">All Locations</option>
          <option value="Yard-01">Yard-01</option>
          <option value="Yard-02">Yard-02</option>
          <option value="Yard-03">Yard-03</option>
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
          placeholder="Search truck / RFID / event..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ ...inputStyle, minWidth: 260 }}
        />
      </div>

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
              <tr key={row.sno}>
                {[
                  row.sno,
                  row.date,
                  row.time,
                  row.truckNo,
                  row.rfidNo,
                  row.location,
                  row.event,
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

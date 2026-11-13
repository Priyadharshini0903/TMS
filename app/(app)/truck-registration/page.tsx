"use client";

import { useState, useEffect } from "react";

export default function TruckRegistrationPage() {
  const [shipmentType, setShipmentType] = useState("");
  const [truckNo, setTruckNo] = useState("");
  const [tagNo, setTagNo] = useState("");
  const [message, setMessage] = useState("");
  const [readingTag, setReadingTag] = useState(false);
  const [registering, setRegistering] = useState(false);

  const handleClear = () => {
    setShipmentType("");
    setTruckNo("");
    setTagNo("");
    setMessage("");
  };

  const [connectionStatus, setConnectionStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");

  useEffect(() => {
    let active = true;

    const checkConnection = async () => {
      try {
        const response = await fetch("/api/truck-registration/connection", {
          cache: "no-store",
        });

        const data = await response.json();

        if (active) {
          setConnectionStatus(data.connected ? "connected" : "disconnected");
        }
      } catch {
        if (active) {
          setConnectionStatus("disconnected");
        }
      }
    };

    checkConnection();

    const interval = setInterval(checkConnection, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleReadTag = async () => {
    setReadingTag(true);
    setMessage("");

    try {
      const response = await fetch("/api/truck-registration/read-tag", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Unable to read RFID tag");
        return;
      }

      setTagNo(data.tagNo);
      setMessage("RFID tag read successfully");
    } catch (error) {
      console.error("Read Tag error:", error);
      setMessage("Unable to read RFID tag");
    } finally {
      setReadingTag(false);
    }
  };

  const handleRegister = async () => {
    if (!shipmentType || !truckNo.trim() || !tagNo.trim()) {
      setMessage("Please fill all required fields.");
      return;
    }

    setRegistering(true);
    setMessage("");

    try {
      const response = await fetch("/api/truck-registration/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shipmentType,
          truckNo,
          tagNo,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Truck registration failed");
        return;
      }

      setMessage(`TMS API response: ${data.message} (HTTP ${data.httpStatus})`);
    } catch (error) {
      console.error("Truck registration error:", error);
      setMessage("Unable to complete truck registration.");
    } finally {
      setRegistering(false);
    }
  };

  const labelClass = "mb-2 block text-base font-semibold text-slate-700";

  const inputClass =
    "h-[46px] w-full rounded-md border border-[#CBD5E1] bg-[#F1F5F9] px-3 text-[15px] text-slate-900 outline-none placeholder:text-gray-500 focus:border-[#0891B2] focus:ring-1 focus:ring-[#0891B2] disabled:cursor-not-allowed disabled:bg-[#F1F5F9] disabled:text-slate-400";

  const buttonClass =
    "h-[46px] rounded-md px-5 text-[15px] font-semibold transition duration-200";

  const [plantId, setPlantId] = useState("");
  const [plantCode, setPlantCode] = useState("");

  useEffect(() => {
    async function loadPlantInfo() {
      try {
        const response = await fetch("/api/truck-registration/plant-info");

        if (!response.ok) {
          throw new Error("Unable to load plant information");
        }

        const data = await response.json();

        setPlantId(data.plantId);
        setPlantCode(data.plantCode);
      } catch (error) {
        console.error("Plant information error:", error);
      }
    }

    loadPlantInfo();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-3 md:p-4 text-slate-900">
      {/* Page heading */}
      <div className="mb-4 rounded-md border border-[#CBD5E1] bg-[#FFFFFF] px-5 py-3">
        <h1 className="text-xl font-bold tracking-wide text-[#0E7490]">
          Add Truck
        </h1>
      </div>

      {/* Registration panel */}
      <div className="w-full rounded-md border border-[#CBD5E1] bg-[#FFFFFF] shadow-lg shadow-slate-900/10">
        <div className="relative p-5 md:p-6">
          {/* Connection status */}
          <div className="absolute right-5 top-5">
            <span
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-semibold ${
                connectionStatus === "connected"
                  ? "border-green-500/40 bg-green-500/15 text-green-700"
                  : connectionStatus === "checking"
                    ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-400"
                    : "border-red-500/40 bg-red-500/15 text-red-400"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-500"
                    : connectionStatus === "checking"
                      ? "bg-yellow-400"
                      : "bg-red-500"
                }`}
              />

              {connectionStatus === "connected"
                ? "Connected"
                : connectionStatus === "checking"
                  ? "Checking..."
                  : "Disconnected"}
            </span>
          </div>

          {/* First row */}
          <div className="grid grid-cols-1 gap-6 pr-0 md:grid-cols-2 md:pr-[35%]">
            <div>
              <label className={labelClass}>
                Plant ID:<span className="text-red-400">*</span>
              </label>
              <input
                className={inputClass}
                value={plantId}
                placeholder="Plant ID"
                disabled
                readOnly
              />
            </div>

            <div>
              <label className={labelClass}>
                Plant Code:<span className="text-red-400">*</span>
              </label>
              <input
                className={inputClass}
                value={plantCode}
                placeholder="Plant Code"
                disabled
                readOnly
              />
            </div>
          </div>

          {/* Second row */}
          <div className="mt-5 grid grid-cols-1 items-end gap-4 lg:grid-cols-[260px_290px_minmax(220px,1fr)_auto_auto]">
            <div>
              <label className={labelClass}>
                Shipment Type:<span className="text-red-400">*</span>
              </label>
              <select
                className={inputClass}
                value={shipmentType}
                onChange={(e) => setShipmentType(e.target.value)}
              >
                <option value="">Select Shipment Type</option>
                <option value="OUTBOUND">OUTBOUND</option>
                <option value="INBOUND">INBOUND</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Truck No:<span className="text-red-400">*</span>
              </label>
              <input
                className={inputClass}
                value={truckNo}
                onChange={(e) => setTruckNo(e.target.value.toUpperCase())}
                placeholder="Enter Truck Number"
              />
            </div>

            <div>
              <label className={labelClass}>
                Tag No:<span className="text-red-400">*</span>
              </label>
              <input
                className={inputClass}
                value={tagNo}
                onChange={(e) => setTagNo(e.target.value)}
                placeholder="Enter or Read RFID Tag"
              />
            </div>

            <button
              type="button"
              onClick={handleReadTag}
              disabled={readingTag}
              className={`${buttonClass} min-w-[135px] border border-[#0E7490] bg-[#0E7490] text-[#FFFFFF] hover:bg-[#0891B2] disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {readingTag ? "Reading..." : "Read Tag"}
            </button>

            <button
              type="button"
              onClick={handleClear}
              className={`${buttonClass} min-w-[85px] border border-red-500/50 bg-red-600/90 text-white hover:bg-red-500`}
            >
              Clear
            </button>
          </div>

          {/* Response message */}
          {message && (
            <div className="mt-5 rounded-md border border-[#CBD5E1] bg-[#F1F5F9] px-4 py-3 text-sm text-[#0E7490]">
              {message}
            </div>
          )}

          {/* Register section */}
          <div className="mt-7 border-t border-[#CBD5E1] pt-5">
            <button
              type="button"
              onClick={handleRegister}
              disabled={registering}
              className={`${buttonClass} min-w-[130px] border border-[#0891B2] bg-[#16a085] text-white hover:bg-[#19b99a] disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {registering ? "REGISTERING..." : "REGISTER"}
            </button>
          </div>

          <div className="mt-5 border-t border-[#CBD5E1]" />
        </div>
      </div>
    </div>
  );
}

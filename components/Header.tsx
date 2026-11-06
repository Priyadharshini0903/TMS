
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Header() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateTime = () => setNow(new Date());

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  const date = now
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(now)
    : "--";

  const time = now
    ? new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now)
    : "--:--:--";

  return (
    <header className="app-header">
      <div className="header-logo">
        <Image
          src="/dcbl-logo.png"
          alt="Company Logo"
          width={180}
          height={60}
          priority
          className="company-logo"
        />
      </div>

      <div className="header-heading">
        <h1>DCBL Gate Management System</h1>
        <p>RFID &amp; Weighbridge Management</p>
      </div>

      <div className="header-datetime">
        <span className="header-date">{date}</span>
        <span className="header-time">{time}</span>
      </div>
    </header>
  );
}

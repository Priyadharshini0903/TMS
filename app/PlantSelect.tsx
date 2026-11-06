"use client";
import { useState } from "react";
import type { Plant } from "@/lib/db";
import { useRouter } from "next/navigation";


export default function PlantSelect({ plants }: { plants: Plant[] }) {
  const [plant, setPlant] = useState("");
  const router = useRouter();
 
async function proceed() {
  if (!plant) return alert("Please Select your Plant");
  const [plantId, plantCode] = plant.split("|");
  const r = await fetch("/api/plant-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plantId, plantCode }),
  });
   if (r.ok) router.push("/gate-rfid");
  else alert((await r.json()).error ?? "Could not start session");
}

  return (
    <div className="space-y-4">
      <select
        value={plant}
        onChange={(e) => setPlant(e.target.value)}
        className="w-full rounded-lg border border-teal bg-pill px-3 py-2 text-pill-text outline-none focus:border-accent"
      >
        <option value="">Select the Plant</option>
        {plants.map((p) => (
          <option key={p.Plantcode} value={`${p.PlantcodeName}|${p.Plantcode}`}>
  {p.PlantName}, {p.Plantcode}
</option>
        ))}
      </select>
      <button
        onClick={proceed}
        className="w-full rounded-lg bg-accent py-2 font-semibold text-page hover:opacity-90"
      >
        Click here to Proceed
      </button>
    </div>
  );
}




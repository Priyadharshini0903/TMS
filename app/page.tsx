import { Suspense } from "react";
import { connection } from "next/server";
import { getPlants, type Plant } from "@/lib/db";
import PlantSelect from "./PlantSelect";

async function Plants() {
  await connection(); // render per request, not at build time
  let plants: Plant[] = [];
  let error = "";
  try {
    plants = await getPlants();
  } catch (e) {
    error = e instanceof Error ? e.message : "Database error";
  }
  return (
    <>
      <PlantSelect plants={plants} />
      {error && <p className="mt-4 text-sm text-badge">{error}</p>}
    </>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div
        className="w-full max-w-xl rounded-2xl border border-teal/40 p-8 text-center"
        style={{ background: "linear-gradient(135deg,#1a1a1a,#1e1e1e)" }}
      >
        <h1 className="text-2xl font-bold italic text-accent">
          ACCSYS RFID/WB CONTROL SYSTEM
          <sup className="ml-2 text-sm text-teal">{process.env.NEXT_PUBLIC_TMS_MODE}</sup>
        </h1>
        <div className="mt-8">
          <Suspense fallback={<p className="text-muted">Loading plants…</p>}>
            <Plants />
          </Suspense>
        </div>
      </div>
      <p className="fixed bottom-4 text-xs text-muted">
        Design &amp; Developed By Accsys Electronics-Chennai All rights reserved (20260303 v-1.11)
      </p>
    </main>
  );
}
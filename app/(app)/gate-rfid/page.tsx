import { redirect } from "next/navigation";
import { getSession, getGates } from "@/lib/plant";
import GateScreen from "./GateScreen";

export const dynamic = "force-dynamic";

export default async function GateRfid() {
  const s = await getSession();
  if (!s) redirect("/");
  let gates: { SID: number; LOCATION: string }[] = [];
  let error = "";
  try {
    gates = await getGates(s);
  } catch (e) {
    error = e instanceof Error ? e.message : "Database error";
  }
   return (
    <main className="p-4">
      <h1 className="mb-4 text-xl font-bold text-accent">Gate RFID(s)</h1>
      {error && (
        <p className="mb-4 rounded-lg border border-badge/50 bg-badge/10 px-3 py-2 text-sm text-badge">
          {error}
        </p>
      )}
      <GateScreen gates={gates} />
    </main>
  );
}
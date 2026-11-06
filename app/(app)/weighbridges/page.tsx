import { redirect } from "next/navigation";
import { getSession, getWeighbridges } from "@/lib/plant";
import WeighbridgeScreen from "./WeighbridgeScreen";

export const dynamic = "force-dynamic";

export default async function WeighbridgesPage() {
  const session = await getSession();
  if (!session) redirect("/");

  let weighbridges: { WBID: number; [key: string]: unknown }[] = [];
  let error = "";

  try {
    weighbridges = await getWeighbridges(session);
  } catch (e) {
    error = e instanceof Error ? e.message : "Unable to load weighbridges";
  }

  return (
    <main className="p-3 sm:p-4">
      <h1 className="mb-4 text-xl font-bold text-accent">Weighbridge(s)</h1>
      {error ? (
        <div className="rounded-xl border border-badge/40 bg-badge/10 p-4 text-sm text-badge">
          Could not load the weighbridge list: {error}
        </div>
      ) : weighbridges.length === 0 ? (
        <div className="rounded-xl border border-teal/30 bg-[#1a1a1a] p-4 text-sm text-muted">
          No weighbridges are configured for this plant.
        </div>
      ) : (
        <WeighbridgeScreen weighbridges={weighbridges} />
      )}
    </main>
  );
}

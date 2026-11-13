
import { redirect } from "next/navigation";
import { getSession, getRawWeighbridges } from "@/lib/plant";
import WeighbridgeScreen from "../weighbridges/WeighbridgeScreen";

export const dynamic = "force-dynamic";

export default async function RawWeighbridgesPage() {
  const session = await getSession();

  if (!session) redirect("/");

  // Only Ariyalur can access Raw Weighbridges.
  if (session.plantId !== "ALR") {
    redirect("/weighbridges");
  }

  let weighbridges: { WBID: number; [key: string]: unknown }[] = [];
  let error = "";

  try {
    weighbridges = await getRawWeighbridges(session);
  } catch (e) {
    error =
      e instanceof Error ? e.message : "Unable to load raw weighbridges";
  }

  return (
    <main className="p-3 sm:p-4">
      <h1 className="mb-4 text-xl font-bold text-accent">
        Raw Weighbridge(s)
      </h1>

      {error ? (
        <div className="rounded-xl border border-badge/40 bg-badge/10 p-4 text-sm text-badge">
          Could not load raw weighbridges: {error}
        </div>
      ) : weighbridges.length === 0 ? (
        <div className="rounded-xl border border-teal/30 bg-[#1a1a1a] p-4 text-sm text-muted">
          No raw weighbridges are configured.
        </div>
      ) : (
        <WeighbridgeScreen weighbridges={weighbridges} mode="raw" />
      )}
    </main>
  );
}

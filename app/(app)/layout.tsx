import { redirect } from "next/navigation";
import { getSession, getPlant } from "@/lib/plant";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/");
  const p = await getPlant(s);
  if (!p) redirect("/");
  return (
    <AppShell
      plantId={s.plantId}
      plantCode={s.plantCode}
      mode={process.env.NEXT_PUBLIC_TMS_MODE}
      truckReg={Number(p.truckReg) === 0}
      autoWb={Number(p.totWbCountAuto) > 0}
      raw={s.plantId === "ALR"}
      bulker={Number(p.totWbCountBulker) > 0}
    >
      {children}
    </AppShell>
  );
}
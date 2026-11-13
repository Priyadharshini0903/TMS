import { redirect } from "next/navigation";
import { getSession, getPlant } from "@/lib/plant";
import AppShell from "@/components/AppShell";
import { cookies } from "next/headers";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth";



export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  let signedIn = false;
  try {
    signedIn = !!token && (await verifyToken(token)).typ === "session";
  } catch { }
  if (!signedIn) redirect("/");

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
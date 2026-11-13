import { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getPlants, type Plant } from "@/lib/db";
import { verifyToken, SESSION_COOKIE } from "@/lib/auth";
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

// Reads the SSO cookie set by /api/sso/callback
async function getUser() {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const p = await verifyToken(token);
    if (p.typ !== "session") return null;
    return { name: String(p.name ?? ""), email: String(p.email ?? "") };
  } catch {
    return null;
  }
}

function MicrosoftLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sso?: string }>;
}) {
  const user = await getUser();
  const { sso } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div
        className="w-full max-w-xl rounded-2xl border border-teal/40 bg-white p-8 text-center shadow-xl shadow-slate-900/10"
      >
        <h1 className="text-2xl font-bold italic text-accent">
          ACCSYS RFID/WB CONTROL SYSTEM
          <sup className="ml-2 text-sm text-teal">{process.env.NEXT_PUBLIC_TMS_MODE}</sup>
        </h1>
        <div className="mt-8">
          {user ? (
            <>
              <p className="mb-4 text-sm text-muted">Signed in as {user.name || user.email}</p>
              <Suspense fallback={<p className="text-muted">Loading plants…</p>}>
                <Plants />
              </Suspense>
            </>
          ) : (
            <>
              <p className="mb-5 text-sm text-muted">
                Sign in with your company Microsoft account to continue
              </p>
              <a
                href="/api/sso/login"
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-accent py-2.5 font-semibold text-white transition hover:bg-teal"
              >
                <MicrosoftLogo />
                Sign in with Microsoft
              </a>
              {sso === "failed" && (
                <p className="mt-4 text-sm text-badge">Sign-in failed. Please try again.</p>
              )}
            </>
          )}
        </div>
      </div>
      <p className="fixed bottom-4 text-xs text-muted">
        Design &amp; Developed By Accsys Electronics-Chennai All rights reserved (20260303 v-1.11)
      </p>
    </main>
  );
}
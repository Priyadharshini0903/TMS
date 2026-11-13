import { NextResponse } from "next/server";
import { decodeJwt } from "jose";
import { signToken, verifyToken, SESSION_COOKIE } from "@/lib/auth";

const SESSION_SECONDS = 12 * 60 * 60;

// Microsoft POSTs here after login (replaces PHP GetUserMailId() + index()).
export async function POST(req: Request) {
  // 303 turns the redirect into a GET so the browser lands on a normal page.
  const go = (path: string) => NextResponse.redirect(new URL(path, process.env.APP_URL!), 303);

  const form = await req.formData();
  const code = form.get("code")?.toString();
  const state = form.get("state")?.toString();

  if (form.get("error") || !code || !state) return go("/?sso=failed");

  // 1. Check the state we issued in /api/sso/login
  try {
    const s = await verifyToken(state);
    if (s.typ !== "state") return go("/?sso=failed");
  } catch {
    return go("/?sso=failed");
  }

  // 2. Swap the code for tokens (client_secret stays on the server)
  const r = await fetch(
    `https://login.microsoftonline.com/${process.env.AD_TENANT}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.AD_CLIENT_ID!,
        client_secret: process.env.AD_CLIENT_SECRET!,
        redirect_uri: process.env.AD_REDIRECT_URI!,
        code,
      }),
    }
  );
  if (!r.ok) return go("/?sso=failed");

  // 3. Read who logged in from the id_token (received directly from Microsoft over TLS)
  const { id_token } = await r.json();
  const claims = decodeJwt(id_token);
  const email = String(claims.email ?? claims.preferred_username ?? "").toLowerCase();
  if (!email) return go("/?sso=failed");

  // 4. Start our own session
  const res = go("/");
  res.cookies.set(
    SESSION_COOKIE,
    await signToken({ typ: "session", email, name: String(claims.name ?? "") }, `${SESSION_SECONDS}s`),
    {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_SECONDS,
    }
  );
  return res;
}
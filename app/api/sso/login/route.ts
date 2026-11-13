import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
 
// Replaces PHP ssoLogin(): send the browser to Microsoft.
export async function GET() {
  // Signed, 10-minute "state" (replaces session_id()); checked again in the callback.
  const state = await signToken({ typ: "state" }, "10m");
 
  const params = new URLSearchParams({
    client_id: process.env.AD_CLIENT_ID!,
    response_type: "code",
    response_mode: "form_post", // Microsoft will POST the payload to redirect_uri
    redirect_uri: process.env.AD_REDIRECT_URI!,
    scope: "openid profile email",
    state,
  });
 
  return NextResponse.redirect(
    `https://login.microsoftonline.com/${process.env.AD_TENANT}/oauth2/v2.0/authorize?${params}`
  );
}
 
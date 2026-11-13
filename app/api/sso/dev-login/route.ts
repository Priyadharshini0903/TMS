import { NextResponse } from "next/server";
import { signToken, SESSION_COOKIE } from "@/lib/auth";

// DEV ONLY - delete this file before deployment
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }
  const res = NextResponse.redirect(new URL("/", process.env.APP_URL!));
  res.cookies.set(
    SESSION_COOKIE,
    await signToken({ typ: "session", email: "test@accsys.com", name: "Test User" }, "1h"),
    { httpOnly: true, path: "/", sameSite: "lax" }
  );
  return res;
}
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.delete("plant");
  res.cookies.delete("tms_user");
  return res;
}
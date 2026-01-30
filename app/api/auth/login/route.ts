import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { token } = await req.json();

  const response = NextResponse.json({ success: true });

  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}

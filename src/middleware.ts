import { NextResponse } from "next/server"
import verify from "./function/verify"

export async function middleware(req: Request) {
  const origin = req.headers.get("origin")
  if (origin) {
    return NextResponse.json({ message: "Cors" })
  }
  if (
    !req.url.includes("/api/admin/") &&
    !req.url.includes("/api/mech/") &&
    !req.url.includes("/api/wait/") &&
    !req.url.includes("/api/private/")
  ) {
    return NextResponse.next()
  }
  const token = req.headers.get("Authorization")?.split(" ")[1]
  if (!token) {
    return NextResponse.json({ message: "Required token" })
  }
  const verified: any = (await verify(token)) as any
  if (verified.code) {
    return NextResponse.json({ message: "Invalid token" })
  }
  if (req.url.includes("/api/wait/")) {
    return NextResponse.next()
  }

  if (verified.role === "Admin" && req.url.includes("/api/admin/")) {
    return NextResponse.next()
  }
  if (
    (verified.role === "Mech" || verified.role === "Admin") &&
    req.url.includes("/api/mech/")
  ) {
    return NextResponse.next()
  }
  if (
    (verified.role === "Mech" || verified.role === "Admin") &&
    req.url.includes("/api/private/")
  ) {
    const newHeaders = new Headers(req.headers)
    newHeaders.set("_id", verified._id)
    return NextResponse.next({ request: { headers: newHeaders } })
  }

  return NextResponse.json({ message: "Invalid token" })
}

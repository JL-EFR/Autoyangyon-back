import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import { createHmac } from "node:crypto"
import gentoken from "@/function/gentoken"

export async function PUT(req: Request) {
  const { password, email }: Partial<Login> = await req.json()
  const hash = createHmac("sha256", process.env.PASSWORDSALT!)
    .update(password!)
    .digest("hex")
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const sameid = await database
    .collection("Mechanic")
    .find({ Email: email })
    .toArray()
  if (sameid.length == 0) {
    return NextResponse.json(
      { message: "ไม่พบ Email ดังกล่าว" },
      { status: 400 }
    )
  }
  if (hash != sameid[0].Password) {
    return NextResponse.json(
      { message: "Password ไม่ถูกต้อง" },
      { status: 400 }
    )
  }

  const token = await gentoken(sameid[0])
  if (sameid[0].Role == "Wait") {
    return NextResponse.json({
      message: "บัญชีนี้ยังไม่ได้รับการยืนยัน",
      token: token,
    })
  }
  return NextResponse.json({ token: token })
}

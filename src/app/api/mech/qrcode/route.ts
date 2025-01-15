import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

export async function PUT(req: Request) {
  const { amount } = await req.json()
  const generatePayload = require("promptpay-qr")

  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const admin = await database.collection("Mechanic").findOne({ Role: "Admin" })
  const payload = generatePayload(admin!.Phone, { amount })
  return NextResponse.json({ qrcode: payload })
}

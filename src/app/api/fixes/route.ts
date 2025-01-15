import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

export async function GET() {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const data = await database
    .collection("Fixes")
    .find()
    .sort({ Order: 1 })
    .toArray()
  return NextResponse.json({ data: data })
}

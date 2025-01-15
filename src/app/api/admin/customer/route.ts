import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

export async function GET() {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const data = await database.collection("Customer").find({}).toArray()
  return NextResponse.json({ data: data })
}

export async function POST(req: Request) {
  const { data } = await req.json()
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  await database
    .collection("Customer")
    .insertOne({ ...data, Cars: [], Line: "" })
  return NextResponse.json({ message: "Success" })
}

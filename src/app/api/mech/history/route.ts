import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

export async function GET() {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const accepted = await database
    .collection("Services")
    .find({ Status: "Finished" })
    .sort({ Date: 1 })
    .toArray()
  const under = await database
    .collection("Services")
    .find({ Status: "Underpaid" })
    .sort({ Date: 1 })
    .toArray()

  return NextResponse.json({
    finished: accepted,
    underpaid: under,
  })
}

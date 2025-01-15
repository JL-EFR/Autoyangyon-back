import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

export async function PUT(req: Request) {
  const { data, _id } = await req.json()
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  await database
    .collection("Services")
    .updateOne({ _id: new ObjectId(_id) }, { $set: { Jobs: data } })
  return NextResponse.json({ message: "Success" })
}

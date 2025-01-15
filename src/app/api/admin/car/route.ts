import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

export async function POST(req: Request) {
  const { data, _id } = await req.json()
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  await database
    .collection("Customer")
    .findOneAndUpdate({ _id: new ObjectId(_id) }, { Cars: { $push: data } })
  return NextResponse.json({ message: "Success" })
}

export async function GET() {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const cars = await database
    .collection("Customer")
    .find()
    .project({ Cars: 1, UserName: 1 })
    .toArray()
  return NextResponse.json({ data: cars })
}

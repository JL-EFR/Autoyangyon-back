import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

export async function PUT(req: Request) {
  const { data } = await req.json()
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)

  for (var i of data) {
    const { _id, ...rest } = i
    if (_id !== "empty") {
      await database
        .collection("Fixes")
        .replaceOne({ _id: new ObjectId(_id) }, { ...rest })
    } else {
      await database.collection("Fixes").insertOne({ ...rest })
    }
  }
  return NextResponse.json({ message: "Success" })
}

export async function GET() {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const data = await database.collection("Fixes").find({}).toArray()
  return NextResponse.json({ data: data })
}

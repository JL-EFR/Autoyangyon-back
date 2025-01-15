import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

export async function Put(req: Request) {
  const { role, _id } = await req.json()
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  await database
    .collection("Mechanic")
    .findOneAndUpdate({ _id: new ObjectId(_id) }, { Role: role })
  return NextResponse.json({ message: "Success" })
}

export async function GET() {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const data = await database
    .collection("Mechanic")
    .find()
    .project({ Password: 0 })
    .toArray()
  return NextResponse.json({ data: data })
}

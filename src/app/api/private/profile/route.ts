import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

export async function GET(req: Request) {
  const _id = req.headers.get("_id")
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const data = await database
    .collection("Mechanic")
    .find({ _id: new ObjectId(_id!) })
    .project({ Password: 0 })
    .toArray()

  return NextResponse.json({ data: data[0] })
}

export async function PUT(req: Request) {
  const { username, phone } = await req.json()
  const _id = req.headers.get("_id")
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  let newprofile: any = { $set: {} }
  if (username !== "") {
    newprofile.$set.UserName = username
  }
  if (phone !== "") {
    newprofile.$set.Phone = phone
  }
  await database
    .collection("Mechanic")
    .findOneAndUpdate({ _id: new ObjectId(_id!) }, newprofile)
  return NextResponse.json({ message: "success" })
}

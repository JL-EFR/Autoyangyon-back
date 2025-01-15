import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"
import { createHmac } from "node:crypto"

export async function PUT(req: Request) {
  const { password } = await req.json()
  const _id = req.headers.get("_id")
  const hash = createHmac("sha256", process.env.PASSWORDSALT!)
    .update(password!)
    .digest("hex")
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  await database
    .collection("Mechanic")
    .findOneAndUpdate({ _id: new ObjectId(_id!) }, { Password: { $set: hash } })
  return NextResponse.json({ message: "success" })
}

import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"
import gentoken from "@/function/gentoken"
import verify from "@/function/verify"

export async function GET(req: Request) {
  const token = req.headers.get("Authorization")?.split(" ")[1]
  const verified: any = (await verify(token!)) as any
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const sameid = await database
    .collection("Mechanic")
    .find({ _id: new ObjectId(verified._id) })
    .toArray()
  if (sameid.length == 0) {
    return NextResponse.json({ message: "พบข้อผิดพลาดกรุณา Login ใหม่" })
  } else {
    const newtoken = await gentoken(sameid[0])
    return NextResponse.json({ token: newtoken })
  }
}

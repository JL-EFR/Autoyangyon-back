import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"
import { sendline } from "@/function/replyline"

export async function PUT(req: Request) {
  const { _id } = await req.json()
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const data = await database
    .collection("Services")
    .findOneAndUpdate(
      { _id: new ObjectId(_id) },
      { $set: { Status: "Returning" } }
    )
  if (!data) {
    return NextResponse.json({ message: "Not found" })
  }
  const customer = await database
    .collection("Customer")
    .findOne({ "Cars.Plate": data!.Plate })
  if (!customer) {
    return NextResponse.json({ message: "Not found" })
  }
  if (customer.Line !== "") {
    await sendline(customer.Line, "รถที่กำลังซ่อมอยู่ได้ซ่อมเสร็จสิ้นแล้ว")
    return NextResponse.json({ message: "Success" })
  }
  return NextResponse.json({ message: "Success" })
}

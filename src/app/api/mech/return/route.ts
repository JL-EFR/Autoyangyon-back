import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

export async function PUT(req: Request) {
  const { _id, data, paid } = await req.json()
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)

  var amount = 0
  for (var item of data) {
    amount += item.Price
  }
  var status = ""
  if (amount <= paid.Amount) {
    status = "Finished"
  } else {
    status = "Underpaid"
  }
  await database
    .collection("Services")
    .updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: { Jobs: data, Status: status, Date: new Date() },
        $push: { Payment: paid },
      }
    )
  return NextResponse.json({ message: "Success" })
}

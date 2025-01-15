import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

export async function PUT(req: Request) {
  const { _id, paid } = await req.json()
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const itemdata = await database
    .collection("Services")
    .findOne({ _id: new ObjectId(_id) })

  var priceamount = 0
  for (var item of itemdata!.Jobs) {
    priceamount += item.Price
  }
  var paidamount = 0
  for (var item of itemdata!.Payment) {
    paidamount += item.Amount
  }
  paidamount += paid.Amount
  var status = ""
  if (priceamount <= paidamount) {
    status = "Finished"
  } else {
    status = "Underpaid"
  }
  await database.collection("Services").updateOne(
    { _id: new ObjectId(_id) },
    {
      $set: { Status: status, Date: new Date() },
      $push: { Payment: paid },
    }
  )
  return NextResponse.json({ message: "Success" })
}

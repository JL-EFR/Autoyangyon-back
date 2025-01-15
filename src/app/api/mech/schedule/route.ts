import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

export async function POST(req: Request) {
  const { data, date } = await req.json()
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const objID = new ObjectId()
  await database
    .collection("Services")
    .insertOne({ ...data, Status: "Receiving", Payment: [], _id: objID })
  let newdate = new Date(date)
  await database
    .collection("Schedules")
    .insertOne({ ServicesID: objID, Date: newdate })
  return NextResponse.json({ message: "Success" })
}

export async function GET() {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  let today = new Date()
  today.setHours(0, 0, 0, 0)
  const ScheduleDetail = await database
    .collection("Schedules")
    .aggregate([
      {
        $lookup: {
          from: "Services",
          localField: "ServicesID",
          foreignField: "_id",
          as: "ScheduleDetail",
        },
      },
    ])
    .toArray()
  let final: Array<any> = []
  for (let entry of ScheduleDetail) {
    if (entry.ScheduleDetail[0].Status === "Receiving" && entry.Date > today) {
      final.push(entry)
    }
  }
  return NextResponse.json({ data: final })
}

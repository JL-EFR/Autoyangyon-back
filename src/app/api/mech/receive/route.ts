import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

export async function POST(req: Request) {
  const { data } = await req.json()
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  await database
    .collection("Services")
    .insertOne({ ...data, Status: "Working", Payment: [] })
  return NextResponse.json({ message: "Success" })
}

export async function PUT(req: Request) {
  const { _id, mile, jobs } = await req.json()
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  let jobarray: Array<any> = []
  for (let j of jobs) {
    jobarray.push({
      JobID: j,
      Price: 0,
    })
  }
  if (jobs.length === 0) {
    await database
      .collection("Services")
      .findOneAndUpdate(
        { _id: new ObjectId(_id) },
        { $set: { Status: "Working", Mile: mile } }
      )
  } else {
    await database
      .collection("Services")
      .findOneAndUpdate(
        { _id: new ObjectId(_id) },
        { $set: { Status: "Working", Mile: mile, Jobs: jobarray } }
      )
  }

  return NextResponse.json({ message: "Success" })
}

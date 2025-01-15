import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

export async function GET() {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)

  const Returning = await database
    .collection("Services")
    .find({ Status: "Returning" })
    .toArray()
  const Working = await database
    .collection("Services")
    .find({ Status: "Working" })
    .toArray()

  var today = new Date()
  today.setHours(0, 0, 0, 0)
  var endtoday = new Date()
  endtoday.setHours(23, 59, 59, 999)
  const scheduletoday = await database
    .collection("Schedules")
    .find({ Date: { $gt: today, $lt: endtoday } })
    .toArray()
  var todayQueue: Array<any> = []
  for (let entry of scheduletoday) {
    todayQueue.push(entry.ServicesID)
  }
  var Receiving = await database
    .collection("Services")
    .find({ _id: { $in: todayQueue }, Status: "Receiving" })
    .toArray()
  var plates: Array<any> = []
  for (let value of Returning) {
    plates.push(value.Plate)
  }
  for (let value of Working) {
    plates.push(value.Plate)
  }
  for (let value of Receiving) {
    plates.push(value.Plate)
  }
  const carsinfo = await database
    .collection("Customer")
    .find({ "Cars.Plate": { $in: plates } })
    .project({ Cars: 1 })
    .toArray()
  var finalcarsinfo: { [key: string]: Partial<CarsInfo> } = {}
  for (let plate of plates) {
    for (let car of carsinfo) {
      for (let i = 0; i < car.Cars.length; i++) {
        if (car["Cars"][i].Plate === plate) {
          finalcarsinfo[plate] = car["Cars"][i]
        }
      }
    }
  }
  return NextResponse.json({
    Returning: Returning,
    Working: Working,
    Receiving: Receiving,
    CarsInfo: finalcarsinfo,
  })
}

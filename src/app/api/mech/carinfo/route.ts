import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

export async function PUT(req: Request) {
  const { plate } = await req.json()
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const carsinfo = await database
    .collection("Customer")
    .find({ "Cars.Plate": plate })
    .project({ Cars: 1, _id: 0, UserName: 1 })
    .toArray()
  let onecar: { [key: string]: CarsInfo } = {}
  for (let car of carsinfo[0].Cars) {
    if (car.Plate === plate) {
      onecar.Plate = car.Plate
      onecar.Brand = car.Brand
      onecar.Model = car.Model
      onecar.Year = car.Year
      onecar.UserName = carsinfo[0].UserName
    }
  }
  return NextResponse.json({ data: onecar })
}

export async function GET() {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const carsinfo = await database
    .collection("Customer")
    .find()
    .project({ Cars: 1, _id: 0, UserName: 1, Phone: 1 })
    .toArray()
  let carlist: Array<CarsInfo> = []
  for (let cars of carsinfo) {
    for (let car of cars.Cars) {
      const newcar: CarsInfo = {
        Plate: car.Plate,
        Brand: car.Brand,
        Model: car.Model,
        Year: car.Year,
        UserName: cars.UserName,
        Phone: cars.Phone,
      }
      carlist.push(newcar)
    }
  }
  return NextResponse.json({ data: carlist })
}

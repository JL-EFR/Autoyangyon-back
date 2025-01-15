import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"
import { createHmac } from "node:crypto"
import gentoken from "@/function/gentoken"
import { OAuth2Client } from "google-auth-library"

const clientID = [process.env.CLIENTID1!, process.env.CLIENTID2!]

export async function PUT(req: Request) {
  const client = new OAuth2Client()

  const { idToken } = await req.json()
  const ticket = await client.verifyIdToken({
    idToken: idToken,
    audience: clientID, // Specify the CLIENT_ID of the app that accesses the backend
  })
  const payload = ticket.getPayload()
  if (!payload) {
    return NextResponse.json(
      { message: "Google ไม่สามารถตรวจสอบ Acount ได้" },
      { status: 400 }
    )
  }
  const mongoClient = new MongoClient(process.env.MONGODB_URI!, {})
  await mongoClient.connect()
  const database = mongoClient.db(process.env.DATABASE_NAME)
  const sameid = await database
    .collection("Mechanic")
    .find({ Email: payload!.email })
    .toArray()
  if (sameid.length == 0) {
    return NextResponse.json(
      { message: "ไม่พบ ID ดังกล่าว", code: "register" },
      { status: 404 }
    )
  }
  const token = await gentoken(sameid[0])
  return NextResponse.json({ token: token })
}

export async function POST(req: Request) {
  const client = new OAuth2Client()

  const { idToken, password, phone } = await req.json()
  const ticket = await client.verifyIdToken({
    idToken: idToken,
    audience: clientID, // Specify the CLIENT_ID of the app that accesses the backend
  })
  const payload = ticket.getPayload()
  if (!payload) {
    return NextResponse.json(
      { message: "Google ไม่สามารถตรวจสอบ Acount ได้" },
      { status: 400 }
    )
  }
  const mongoClient = new MongoClient(process.env.MONGODB_URI!, {})
  await mongoClient.connect()
  const database = mongoClient.db(process.env.DATABASE_NAME)
  const sameid = await database
    .collection("Mechanic")
    .find({ Email: payload!.email })
    .toArray()
  if (sameid.length !== 0) {
    return NextResponse.json(
      {
        message: "มี Account นี้อยู่แล้ว",
        code: "login",
      },
      { status: 400 }
    )
  }
  const hash = createHmac("sha256", process.env.PASSWORDSALT!)
    .update(password!)
    .digest("hex")
  const objID = new ObjectId()
  const newAccount = {
    _id: objID,
    Email: payload!.email,
    Password: hash,
    UserName: payload!.name,
    Phone: phone,
    Role: "Admin",
  }
  database.collection("Mechanic").insertOne(newAccount)
  const token = await gentoken(newAccount)
  return NextResponse.json({ token: token })
}

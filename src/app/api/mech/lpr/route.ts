import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import axios from "axios"
import getFileFromBase64 from "@/function/base64tojpg"
import { writeFile } from "fs/promises"
import path from "path"

const LPR = async (item: any) => {
  const baseURL = "https://api.aiforthai.in.th/panyapradit-lpr"
  const formData = new FormData()
  formData.append("file", item)
  try {
    const response = await axios.post(baseURL, formData, {
      headers: {
        Apikey: process.env.APIKEY,
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  } catch (err) {
    return err
  }
}

export async function POST(req: Request) {
  const { image } = await req.json()
  const file = getFileFromBase64(image, "image.jpg")
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(
    path.join(process.cwd(), "public/uploads/" + "image.jpg"),
    buffer
  )

  const platedata = await LPR(file)
  if (!platedata.r_char) {
    return NextResponse.json({ code: "image error" })
  }
  const plate =
    platedata.r_char +
    platedata.r_digit.replaceAll("0", "") +
    platedata.r_province
  const realplate = plate.replaceAll("/", "")
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const carinfo = await database
    .collection("Customer")
    .find({ "Cars.Plate": realplate })
    .project({ Cars: 1, _id: 0 })
    .toArray()
  if (carinfo.length === 0) {
    return NextResponse.json({ plate: realplate, code: "not found" })
  }
  if (carinfo[0]["Cars"].length > 1) {
    for (let i of carinfo[0]["Cars"]) {
      if (i.Plate === realplate) {
        return NextResponse.json({ plate: realplate, carinfo: i })
      }
    }
  } else if (carinfo[0]["Cars"].length === 1) {
    return NextResponse.json({
      plate: realplate,
      carinfo: carinfo[0]["Cars"][0],
    })
  }

  return NextResponse.json({ plate: realplate, code: "not found" })
}

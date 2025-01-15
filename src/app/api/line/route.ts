import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"
import { replyline } from "@/function/replyline"
import { createHmac } from "crypto"

const regis = async (id: string, msg: Array<string>, token: string) => {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const cus = await database.collection("Customer").find({ Line: id }).toArray()
  if (cus[0]) {
    replyline(token, "มี Account อยู่แล้วไม่สามารถเพิ่ม Account ได้")
    return
  }
  await database
    .collection("Customer")
    .insertOne({ UserName: msg[1], Line: id, Phone: msg[2], Cars: [] })
  replyline(token, "เพิ่ม Account สำเร็จ")
}

const addcar = async (id: string, msg: Array<string>, token: string) => {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const cus = await database.collection("Customer").find({ Line: id }).toArray()
  if (!cus[0]) {
    replyline(token, "ไม่มี Account อยู่ไม่สามารถเพิ่มรถได้")
    return
  }
  for (let i of cus[0].Cars) {
    if (i.Plate === msg[1]) {
      replyline(token, "มีรถคันนี้อยู่แล้วในรายการรถ")
      return
    }
  }
  await database.collection("Customer").updateOne(
    { Line: id },
    {
      $push: {
        Cars: { Plate: msg[1], Brand: msg[2], Model: msg[3], Year: +msg[4] },
      },
    }
  )
  replyline(token, "เพิ่มรถสำเร็จ")
}

const cars = async (id: string, token: string) => {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const cus = await database.collection("Customer").find({ Line: id }).toArray()
  if (!cus[0]) {
    replyline(token, "ไม่มี Account อยู่ไม่สามารถแสดงรถได้")
    return
  }
  if (cus[0].Cars.length === 0) {
    replyline(token, "ไม่มีรถอยู่ไม่สามารถแสดงรถได้")
    return
  }
  let clist = "รายการรถ"
  for (let i of cus[0].Cars) {
    clist += "\n" + i.Plate
  }
  replyline(token, clist)
}

const reserve = async (id: string, msg: Array<string>, token: string) => {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const cus = await database.collection("Customer").find({ Line: id }).toArray()
  if (!cus[0]) {
    replyline(token, "ไม่มี Account อยู่ไม่สามารถจองคิวได้")
    return
  }
  let found = false
  for (let i of cus[0].Cars) {
    if (i.Plate === msg[1]) {
      found = true
    }
  }
  if (!found) {
    replyline(token, "ไม่พบรถดังกล่าว")
    return
  }
  const objID = new ObjectId()
  await database.collection("Services").insertOne({
    Plate: msg[1],
    Jobs: [],
    Remark: msg[3],
    Status: "Receiving",
    Payment: [],
    Mile: 0,
    _id: objID,
  })
  const [day, month, year] = msg[2].split("/")
  let newdate = new Date(+year, +month - 1, +day, 8)
  await database
    .collection("Schedules")
    .insertOne({ ServicesID: objID, Date: newdate })
  replyline(token, "เพิ่มคิวสำเร็จ")
}

const months = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
]

const schedule = async (token: string) => {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  let today = new Date()
  today.setHours(0, 0, 0, 0)
  let nextweek = new Date()
  nextweek.setHours(0, 0, 0, 0)
  nextweek.setDate(today.getDate() + 7)
  const ScheduleDetail = await database
    .collection("Schedules")
    .find({ Date: { $gt: today, $lt: nextweek } })
    .toArray()
  let schobj: { [key: string]: number } = {}
  for (let entry of ScheduleDetail) {
    const datestring =
      entry.Date.getDate() +
      " " +
      months[entry.Date.getMonth()] +
      " " +
      entry.Date.getFullYear()
    if (schobj[datestring]) {
      schobj[datestring] += 1
    } else {
      schobj[datestring] = 1
    }
  }
  let msg = "รายการคิวซ่อมใน1สัปดาห์ต่อไปนี้\n"
  for (let key of Object.keys(schobj)) {
    msg += key + " " + schobj[key] + " คัน"
  }
  await replyline(token, msg)
}

const reservelbl = async (id: string, token: string) => {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const cus = await database.collection("Customer").find({ Line: id }).toArray()
  if (!cus[0]) {
    replyline(token, "ไม่มี Account อยู่ไม่สามารถจองคิวได้")
    return
  }
  if (cus[0]["Cars"].length === 0) {
    replyline(token, "ไม่มีรถที่ลงทะเบียนอยู่ไม่สามารถจองคิวได้")
    return
  }
  let rep =
    "กรุณากรอกวันที่ที่ต้องการนัด(วัน/เดือน/ปี)เป็นตัวเลขเช่น 31/1/2024 หรือยกเลิกโดยการพิมพ์ Cancel"
  await database.collection("Schedules").insertOne({ Line: id, State: 1 })
  replyline(token, rep)
}

const addcarlbl = async (id: string, token: string) => {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const cus = await database.collection("Customer").find({ Line: id }).toArray()
  if (!cus[0]) {
    replyline(token, "ไม่มี Account อยู่ไม่เพิ่มรถได้")
    return
  }
  let rep =
    "กรุณากรอกป้ายทะเบียนรถดังตัวอย่าง '9ฮฮ9999เชียงใหม่' หรือยกเลิกโดยการพิมพ์ Cancel"
  await database
    .collection("Customer")
    .updateOne({ Line: id }, { $push: { Cars: { State: 1 } } })
  replyline(token, rep)
}

const registerlbl = async (id: string, token: string) => {
  const client = new MongoClient(process.env.MONGODB_URI!, {})
  await client.connect()
  const database = client.db(process.env.DATABASE_NAME)
  const cus = await database.collection("Customer").find({ Line: id }).toArray()
  if (cus[0]) {
    replyline(token, "มี Account อยู่แล้วไม่สามารถสมัครสมาชิกได้")
    return
  }
  let rep = "กรุณากรอกชื่อที่ต้องการให้ช่างเห็น หรือยกเลิกโดยการพิมพ์ Cancel"
  await database.collection("Customer").insertOne({ Line: id, State: 1 })
  replyline(token, rep)
}

export async function POST(req: Request) {
  const json = await req.json()
  const channelSecret = process.env.LINESECRET
  const body = JSON.stringify(json)
  const signature = createHmac("SHA256", channelSecret!)
    .update(body)
    .digest("base64")
  if (signature !== req.headers.get("x-line-signature")) {
    return NextResponse.json({})
  }
  for (let e of json.events) {
    const client = new MongoClient(process.env.MONGODB_URI!, {})
    await client.connect()
    const database = client.db(process.env.DATABASE_NAME)
    const sche = await database
      .collection("Schedules")
      .find({ Line: e.source.userId })
      .toArray()
    if (sche[0]) {
      const command = e.message.text.toLowerCase().replace(" ", "")
      if (command === "cancel") {
        if (sche[0].State > 2) {
          await database
            .collection("Services")
            .deleteOne({ _id: sche[0].ServicesID })
        }
        await database
          .collection("Schedules")
          .deleteOne({ Line: e.source.userId })
        replyline(e.replyToken, "ยกเลิกการจองเรียบร้อย")
        return NextResponse.json({})
      }
      if (sche[0].State === 1) {
        const [day, month, year] = command.split("/")
        let newdate = new Date(+year, +month - 1, +day, 8)
        await database
          .collection("Schedules")
          .updateOne(
            { Line: e.source.userId },
            { $set: { Date: newdate, State: 2 } }
          )
        let rep = "กรุณาเลือกรถจากรายการต่อไปนี้โดยพิมพ์เพียงตัวเลขเท่านั้น"
        const user = await database
          .collection("Customer")
          .findOne({ Line: e.source.userId })
        for (let car in user!.Cars) {
          const label = `\n(${car}) ${user!.Cars[car].Plate}`
          rep += label
        }
        replyline(e.replyToken, rep)
      }
      if (sche[0].State === 2) {
        const user = await database
          .collection("Customer")
          .findOne({ Line: e.source.userId })
        const car = user!.Cars[Number(command)]
        const objID = new ObjectId()
        await database
          .collection("Schedules")
          .updateOne(
            { Line: e.source.userId },
            { $set: { ServicesID: objID, State: 3 } }
          )
        await database.collection("Services").insertOne({
          Plate: car.Plate,
          Jobs: [],
          Status: "Receiving",
          Payment: [],
          Mile: 0,
          _id: objID,
        })
        replyline(e.replyToken, "กรุณากรอกหมายเหตุการซ่อมให้กับช่าง")
      }
      if (sche[0].State === 3) {
        await database
          .collection("Schedules")
          .updateOne(
            { Line: e.source.userId },
            { $unset: { State: 1, Line: 1 } }
          )
        await database.collection("Services").updateOne(
          {
            _id: sche[0].ServicesID,
          },
          { $set: { Remark: command } }
        )
        replyline(e.replyToken, "เพิ่มคิวเสร็จสิ้น")
      }
      return NextResponse.json({})
    }
    const newuser = await database
      .collection("Customer")
      .find({ Line: e.source.userId })
      .toArray()
    if (newuser[0] && newuser[0]["State"]) {
      const command = e.message.text.toLowerCase().replace(" ", "")
      if (command === "cancel") {
        await database
          .collection("Customer")
          .deleteOne({ Line: e.source.userId })
        replyline(e.replyToken, "ยกเลิกการลงทะเบียนเรียบร้อย")
        return NextResponse.json({})
      }
      if (newuser[0]["State"] === 1) {
        await database
          .collection("Customer")
          .updateOne(
            { Line: e.source.userId },
            { $set: { UserName: command, State: 2 } }
          )
        replyline(e.replyToken, "กรุณากรอกเบอร์โทรศัพท์")
      }
      if (newuser[0]["State"] === 2) {
        await database
          .collection("Customer")
          .updateOne(
            { Line: e.source.userId },
            { $set: { Phone: command, Cars: [] }, $unset: { State: 1 } }
          )
        replyline(e.replyToken, "ลงทะเบียนเสร็จสิ้น")
      }
      return NextResponse.json({})
    }
    if (newuser[0]) {
      const lastcar = newuser[0]["Cars"][newuser[0]["Cars"].length - 1]
      if (lastcar && lastcar["State"]) {
        const command = e.message.text.toLowerCase().replace(" ", "")
        if (command === "cancel") {
          await database
            .collection("Customer")
            .updateOne({ Line: e.source.userId }, { $pop: { Cars: 1 } })
          replyline(e.replyToken, "ยกเลิกการเพิ่มรถเรียบร้อย")
          return NextResponse.json({})
        }
        if (lastcar["State"] === 1) {
          await database
            .collection("Customer")
            .updateOne(
              { Line: e.source.userId, "Cars.State": 1 },
              { $set: { "Cars.$.State": 2, "Cars.$.Plate": command } }
            )
          replyline(e.replyToken, "กรุณากรอกยี่ห้อรถ")
        }
        if (lastcar["State"] === 2) {
          await database
            .collection("Customer")
            .updateOne(
              { Line: e.source.userId, "Cars.State": 2 },
              { $set: { "Cars.$.State": 3, "Cars.$.Brand": command } }
            )
          replyline(e.replyToken, "กรุณากรอกรุ่นรถ")
        }
        if (lastcar["State"] === 3) {
          await database
            .collection("Customer")
            .updateOne(
              { Line: e.source.userId, "Cars.State": 3 },
              { $set: { "Cars.$.State": 4, "Cars.$.Model": command } }
            )
          replyline(e.replyToken, "กรุณากรอกปีที่รถผลิต")
        }
        if (lastcar["State"] === 4) {
          await database.collection("Customer").updateOne(
            { Line: e.source.userId, "Cars.State": 4 },
            {
              $set: { "Cars.$.Year": Number(command) },
              $unset: { "Cars.$.State": 1 },
            }
          )
          replyline(e.replyToken, "เพิ่มรถเรียบร้อย")
        }
        return NextResponse.json({})
      }
    }

    const split = e.message.text.split("\n")
    switch (split[0].toLowerCase().replace(" ", "")) {
      case "help": {
        const help = "help ดูรายการและวิธีใช้คำสั่ง\n\n"
        const regis =
          "register สมัครสมาชิกเพื่อใช้บริการของร้าน\n* ตัวอย่างการใช้งาน\nregister\nนายสุดหล่อ(ชื่อ)\n0xxxxxxxxx(เบอร์โทรศัพท์)\n\n"
        const addcar =
          "addcar เพิ่มข้อมูลรถลงในบัญชีของตนเอง(ต้องสร้างบัญชีเอาไว้ด้วยคำสั่ง register ก่อน)\n* ตัวอย่างการใช้งาน\naddcar\n9กก9999ชลบุรี(ป้ายทะเบียน)\ntoyota(ยี่ห้อรถ)\ncamry(รุ่นรถ)\n2009(ปีที่รถผลิตเป็น คศ.)\n\n"
        const cars = "cars ดูรายการรถในบัญชี\n\n"
        const sch = "schedule ดูตารางนัดซ่อมรถในคิว 1 สัปดาห์ต่อจากนี้\n\n"
        const reserve =
          "reserve จองคิวซ่อมรถ\n* ตัวอย่างการใช้งาน\nreserve\n9กก9999ชลบุรี(ป้ายทะเบียน)\n31/1/2029(วันที่)\nเปลี่ยนน้ำมันเครื่อง(หมายเหตุงานที่ต้องทำ)"
        replyline(
          e.replyToken,
          "คำสั่งที่ใช้ได้\n\n" + help + regis + addcar + cars + sch + reserve
        )
        break
      }
      case "register": {
        regis(e.source.userId, split, e.replyToken)
        break
      }
      case "addcar": {
        addcar(e.source.userId, split, e.replyToken)
        break
      }

      case "cars": {
        cars(e.source.userId, e.replyToken)
        break
      }
      case "schedule": {
        schedule(e.replyToken)
        break
      }
      case "reserve": {
        reserve(e.source.userId, split, e.replyToken)
        break
      }
      case "reserve(lbl)": {
        reservelbl(e.source.userId, e.replyToken)
        break
      }
      case "addcar(lbl)": {
        addcarlbl(e.source.userId, e.replyToken)
        break
      }
      case "register(lbl)": {
        registerlbl(e.source.userId, e.replyToken)
        break
      }
      default: {
        replyline(
          e.replyToken,
          "ไม่พบคำสั่งกรุณาใช้คำสั่ง help เพื่อ ดูรายการคำสั่งและวิธีใช้คำสั่ง"
        )
        break
      }
    }
  }
  return NextResponse.json({})
}

import axios from "axios"

export const replyline = async (replytoken: any, msg: string) => {
  const baseURL = "https://api.line.me/v2/bot/message/reply"
  const tosent = {
    replyToken: replytoken,
    messages: [{ type: "text", text: msg }],
  }
  try {
    const response = await axios.post(baseURL, tosent, {
      headers: {
        Authorization: `Bearer ${process.env.LINETOKEN}`,
        "Content-Type": "application/json",
      },
    })
    return response.data
  } catch (err) {
    console.log(err)
    return err
  }
}

export const sendline = async (userID: string, msg: string) => {
  const baseURL = "https://api.line.me/v2/bot/message/push"
  const tosent = {
    to: userID,
    messages: [{ type: "text", text: msg }],
  }
  try {
    const response = await axios.post(baseURL, tosent, {
      headers: {
        Authorization: `Bearer ${process.env.LINETOKEN}`,
        "Content-Type": "application/json",
      },
    })
    return response.data
  } catch (err) {
    console.log(err)
    return err
  }
}

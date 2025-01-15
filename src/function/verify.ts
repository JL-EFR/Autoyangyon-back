import { jwtVerify } from "jose"

export default async function verify(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWTSECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (error) {
    return error
  }
}

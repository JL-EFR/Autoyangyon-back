import { SignJWT } from "jose"

export default async function gentoken(user: any) {
  const secret = new TextEncoder().encode(process.env.JWTSECRET)
  const alg = "HS256"
  const token = await new SignJWT({
    UserName: user.UserName,
    _id: user._id,
    role: user.Role,
  })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer("Autoyangyon")
    .setExpirationTime("30d")
    .sign(secret)
  return token
}

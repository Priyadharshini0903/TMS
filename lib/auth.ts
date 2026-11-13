import { SignJWT, jwtVerify, type JWTPayload } from "jose";
 
export const SESSION_COOKIE = "tms_user";
 
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET);
 
export function signToken(payload: JWTPayload, expiresIn: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key());
}
 
export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, key());
  return payload;
}
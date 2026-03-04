import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

function getSecret() {
  const key = process.env.AUTH_SECRET;
  if (!key) throw new Error("AUTH_SECRET environment variable is required");
  return new TextEncoder().encode(key);
}

export async function createToken() {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string) {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return false;
  return verifyToken(token);
}

export function checkPassword(password: string) {
  return password === process.env.ADMIN_PASSWORD;
}

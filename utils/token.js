import jwt from "jsonwebtoken";

export function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME || "1d",
  });
}

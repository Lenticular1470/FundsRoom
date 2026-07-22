import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { jwtConfig } from "../config/jwt";

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, jwtConfig.secret! as Secret, { expiresIn: jwtConfig.expiresIn } as SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, jwtConfig.secret! as Secret) as JwtPayload;
};


import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import { TAuthUser } from '../interface/common';

const createToken = (
  payload: TAuthUser,
  secret: Secret,
  expiresIn: string,
): string => {
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelpers = { createToken, verifyToken };

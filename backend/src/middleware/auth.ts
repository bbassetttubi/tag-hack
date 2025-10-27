import { Request, Response, NextFunction } from "express";
import httpErrors from "http-errors";
import { getAuth } from "../services/firebaseAdmin";
import { logger } from "../utils/logger";

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    emailVerified?: boolean;
  };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw httpErrors.Unauthorized("No authorization header provided");
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw httpErrors.Unauthorized("Invalid authorization header format. Expected: Bearer <token>");
    }

    const token = parts[1];
    if (!token) {
      throw httpErrors.Unauthorized("No token provided");
    }

    const decodedToken = await getAuth().verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };

    logger.debug({ userId: req.user.uid }, "User authenticated");
    next();
  } catch (error) {
    if (error instanceof httpErrors.HttpError) {
      next(error);
    } else {
      logger.warn({ err: error }, "Token verification failed");
      next(httpErrors.Unauthorized("Invalid or expired token"));
    }
  }
}



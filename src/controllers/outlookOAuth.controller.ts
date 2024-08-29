import { Request, Response, NextFunction } from "express";
import {
  getOutlookAuthURL,
  getOutlookOAuthTokens,
} from "../services/outlookOAuth.service.js";

export function outlookAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const url = getOutlookAuthURL();
    res.redirect(url);
  } catch (error) {
    next(error);
  }
}

export async function outlookOAuthCallback(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tokens = await getOutlookOAuthTokens(req.query.code as string);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
}

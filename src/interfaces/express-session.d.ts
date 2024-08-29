import session from "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    oauthToken?: string;
  }
}

declare module "express" {
  interface Request {
    session: session.Session & Partial<session.SessionData>;
  }
}

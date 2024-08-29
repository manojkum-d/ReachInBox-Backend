import { config as loadEnv } from "dotenv";

// Load environment variables from the .env file
loadEnv();

const _config = {
  port: process.env.PORT || "3000",
  databaseUrl: process.env.DATABASE_URL || "",
  env: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "",
  emailUser: process.env.EMAIL_USER || "",
  emailPass: process.env.EMAIL_PASS || "",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  outlookClientId: process.env.OUTLOOK_CLIENT_ID || "",
  outlookClientSecret: process.env.OUTLOOK_CLIENT_SECRET || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  redisUrl: process.env.REDIS_URL || "",
  oauthRedirectUri:
    process.env.OAUTH_REDIRECT_URI || "http://localhost:8000/oauth2callback",
  outlookRedirectUri:
    process.env.OUTLOOK_REDIRECT_URI ||
    "http://localhost:8000/api/oauth/outlook/callback",
  projectId: process.env.PROJECT_ID,
  subscriptionName: process.env.SUBSCRIPTION_NAME,
  topicName: process.env.TOPIC_NAME,
  openaiOrganization: process.env.OPENAI_ORG_KEY,
  openaiProject: process.env.OPENAI_PROJECT_KEY,
  geminiApi: process.env.GEMINI_API,
};

// Freeze the config object to prevent modifications
export const config = Object.freeze(_config);

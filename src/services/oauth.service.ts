import { Auth } from "googleapis";
import { config } from "../config/config.js";
import { OAuth2Client } from "google-auth-library";

export const oauth2Client = new OAuth2Client(
  config.googleClientId,
  config.googleClientSecret,
  config.oauthRedirectUri
);

export async function getGoogleAuthURL(): Promise<string> {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.labels",
    ],
  });
  return authUrl;
}

export async function getGoogleOAuthTokens(
  code: string
): Promise<Auth.Credentials> {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error("Error fetching Google OAuth tokens:", error);
    throw new Error("Failed to fetch Google OAuth tokens");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getGoogleUserInfo(accessToken: string): Promise<any> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching Google user info:", error);
    throw new Error("Failed to fetch Google user info");
  }
}

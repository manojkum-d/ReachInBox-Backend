import { Request, Response, NextFunction } from "express";
import {
  getGoogleAuthURL,
  getGoogleOAuthTokens,
  getGoogleUserInfo,
} from "../services/oauth.service.js";
import prisma from "../config/prisma.js";

export async function googleAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const url = await getGoogleAuthURL(); // Generate the Google OAuth URL
    res.redirect(url); // Redirect user to Google's OAuth login
  } catch (error) {
    next(error); // Pass any errors to the error handler middleware
  }
}

export async function googleOAuthCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const code = req.query.code as string; // Get the authorization code from the query string
    if (!code) {
      throw new Error("No code provided");
    }

    const tokens = await getGoogleOAuthTokens(code); // Exchange the code for tokens
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    const expiryDate = tokens.expiry_date; // The expiry time in milliseconds since epoch

    if (!accessToken) {
      throw new Error("No access token received from Google");
    }

    const userInfo = await getGoogleUserInfo(accessToken); // Get user info using the access token

    if (!userInfo.email) {
      throw new Error("Failed to retrieve user email from Google");
    }

    // Upsert the user in the database with the new tokens and expiry time
    const user = await prisma.user.upsert({
      where: { email: userInfo.email },
      update: {
        oauthProvider: "google",
        oauthAccessToken: accessToken, // Update access token
        oauthRefreshToken: refreshToken || undefined, // Update refresh token if present
        accessTokenExpiry: expiryDate ? new Date(expiryDate) : null, // Update access token expiry if present
      },
      create: {
        email: userInfo.email,
        oauthProvider: "google",
        oauthAccessToken: accessToken, // Save access token
        oauthRefreshToken: refreshToken, // Save refresh token if present
        accessTokenExpiry: expiryDate ? new Date(expiryDate) : null, // Save access token expiry if present
      },
    });

    res.json({
      message: "User authenticated and saved successfully",
      user,
      accessToken,
    });
  } catch (error) {
    next(error); // Handle any errors during the OAuth callback process
  }
}

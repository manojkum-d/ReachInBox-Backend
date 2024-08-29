import { Router } from "express";
import {
  googleAuth,
  googleOAuthCallback,
} from "../controllers/oauth.controller.js";

const oauthRouter = Router();

/**
 * @swagger
 * /api/oauth/google:
 *   get:
 *     summary: Initiate Google OAuth
 *     description: Redirects to Google OAuth consent screen.
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth consent screen.
 */
oauthRouter.get("/google", googleAuth);

/**
 * @swagger
 * /api/oauth/google/callback:
 *   get:
 *     summary: Handle Google OAuth callback
 *     description: Handles the callback from Google OAuth and provides tokens.
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code returned by Google
 *     responses:
 *       200:
 *         description: Successfully retrieved OAuth tokens.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 refresh_token:
 *                   type: string
 *                 expires_in:
 *                   type: number
 *                 scope:
 *                   type: string
 *                 token_type:
 *                   type: string
 *                 id_token:
 *                   type: string
 *       400:
 *         description: Invalid request.
 *       500:
 *         description: Internal server error.
 */
oauthRouter.get("/google/callback", googleOAuthCallback);

export default oauthRouter;

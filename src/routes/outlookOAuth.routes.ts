import { Router } from "express";
import {
  outlookAuth,
  outlookOAuthCallback,
} from "../controllers/outlookOAuth.controller.js";

const outlookOAuthRouter = Router();

/**
 * @swagger
 * /api/oauth/outlook:
 *   get:
 *     summary: Initiate Outlook OAuth
 *     description: Redirects to Microsoft Outlook OAuth consent screen.
 *     responses:
 *       302:
 *         description: Redirect to Microsoft OAuth consent screen.
 */
outlookOAuthRouter.get("/outlook", outlookAuth);

/**
 * @swagger
 * /api/oauth/outlook/callback:
 *   get:
 *     summary: Handle Outlook OAuth callback
 *     description: Handles the callback from Microsoft OAuth and provides tokens.
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code returned by Microsoft
 *     responses:
 *       200:
 *         description: Successfully retrieved OAuth tokens.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token_type:
 *                   type: string
 *                 scope:
 *                   type: string
 *                 expires_in:
 *                   type: number
 *                 access_token:
 *                   type: string
 *                 refresh_token:
 *                   type: string
 *                 id_token:
 *                   type: string
 *       400:
 *         description: Invalid request.
 *       500:
 *         description: Internal server error.
 */
outlookOAuthRouter.get("/outlook/callback", outlookOAuthCallback);

export default outlookOAuthRouter;

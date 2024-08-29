import { config } from "../config/config.js";
import axios from "axios";

const outlookAuthorizeUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`;
const outlookTokenUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/token`;

export function getOutlookAuthURL(): string {
  const params = new URLSearchParams({
    client_id: config.outlookClientId,
    response_type: "code",
    redirect_uri: config.outlookRedirectUri,
    response_mode: "query",
    scope:
      "openid profile email offline_access https://graph.microsoft.com/Mail.Read",
  });

  return `${outlookAuthorizeUrl}?${params.toString()}`;
}

export async function getOutlookOAuthTokens(code: string) {
  const params = new URLSearchParams({
    client_id: config.outlookClientId,
    scope:
      "openid profile email offline_access https://graph.microsoft.com/Mail.Read",
    code,
    redirect_uri: config.outlookRedirectUri,
    grant_type: "authorization_code",
    client_secret: config.outlookClientSecret,
  });

  const response = await axios.post(outlookTokenUrl, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return response.data;
}

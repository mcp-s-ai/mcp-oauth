import type { Connector } from "../types/connector.types.js"

export const googleConnector: Connector = {
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  scopes: ["openid", "email", "profile"],
  codeExchangeConfig: {
    modelCredentialsMapping: `{
            "access_token": access_token, 
            "expires_at": $fromMillis($millis() + expires_in * 1000),
            "refresh_token": refresh_token,
            "refresh_token_expires_at": null,
            "scope": scope,
            "token_type": token_type
          }`,
    isForm: true,
  },
  authInitUrlParams: {
    access_type: "offline",
    prompt: "consent",
  },
}

import type { Connector } from "../types/connector.types.js"

export const googleSlidesConnector: Connector = {
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  scopes: ["https://www.googleapis.com/auth/presentations.readonly"],
  codeExchangeConfig: {
    modelCredentialsMapping: `{
      "access_token": access_token, 
      "expires_at": $fromMillis($millis() + expires_in * 1000),
      "refresh_token": refresh_token,
      "refresh_token_expires_at": $fromMillis($millis() + refresh_token_expires_in * 1000),
      "scope": scope,
      "token_type": token_type
    }`,
    isForm: true,
  },
  authInitUrlParams: {
    prompt: "consent",
  },
}

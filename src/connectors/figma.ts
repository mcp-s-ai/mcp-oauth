import type { Connector } from "../types/connector.types.js"

export const figmaConnector: Connector = {
  authUrl: "https://www.figma.com/oauth",
  tokenUrl: "https://www.figma.com/api/oauth/token",
  scopes: ["file_read"],
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
}

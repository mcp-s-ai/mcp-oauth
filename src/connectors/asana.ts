import type { Connector } from "../types/connector.types.js"

export const asanaConnector: Connector = {
  authUrl: "https://app.asana.com/-/oauth_authorize",
  tokenUrl: "https://app.asana.com/-/oauth_token",
  scopes: ["default"],
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

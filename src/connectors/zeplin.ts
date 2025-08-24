import type { Connector } from "../types/connector.types.js"

export const zeplinConnector: Connector = {
  authUrl: "https://app.zeplin.io/oauth/authorize",
  tokenUrl: "https://app.zeplin.io/oauth/token",
  scopes: ["read"],
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

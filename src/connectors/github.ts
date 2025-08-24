import type { Connector } from "../types/connector.types.js"

export const githubConnector: Connector = {
  authUrl: "https://github.com/login/oauth/authorize",
  tokenUrl: "https://github.com/login/oauth/access_token",
  scopes: ["repo"],
  codeExchangeConfig: {
    modelCredentialsMapping: `{
            "access_token": access_token, 
            "expires_at": $fromMillis($millis() + expires_in * 1000),
            "refresh_token": refresh_token,
            "refresh_token_expires_at": $fromMillis($millis() + refresh_token_expires_in * 1000),
            "scope": scope,
            "token_type": token_type
          }`,
    isForm: false,
  },
}

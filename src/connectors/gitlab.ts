import type { Connector } from "../types/connector.types.js"

export const gitlabConnector: Connector = {
  authUrl: "https://gitlab.com/oauth/authorize",
  tokenUrl: "https://gitlab.com/oauth/token",
  scopes: ["read_user", "read_repository"],
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

import type { Connector } from "../types/connector.types.js"

export const notionConnector: Connector = {
  authUrl: "https://api.notion.com/v1/oauth/authorize",
  tokenUrl: "https://api.notion.com/v1/oauth/token",
  scopes: ["read_content"],
  codeExchangeConfig: {
    modelCredentialsMapping: `{
      "access_token": access_token, 
      "expires_at": $fromMillis(expires_in-60000),
      "refresh_token": refresh_token,
      "refresh_token_expires_at": null,
      "scope": scope,
      "token_type": token_type
    }`,
    isForm: true,
  },
}

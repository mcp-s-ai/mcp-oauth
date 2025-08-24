import type { Connector } from "../types/connector.types.js"

export const trelloConnector: Connector = {
  authUrl: "https://trello.com/1/authorize",
  tokenUrl: "https://trello.com/1/OAuthGetAccessToken",
  scopes: ["read"],
  codeExchangeConfig: {
    modelCredentialsMapping: `{
      "access_token": access_token, 
      "expires_at": null,
      "refresh_token": null,
      "refresh_token_expires_at": null,
      "scope": scope,
      "token_type": token_type
    }`,
    isForm: true,
  },
}

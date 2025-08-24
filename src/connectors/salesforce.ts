import type { Connector } from "../types/connector.types.js"

export const salesforceConnector: Connector = {
  authUrl: "https://login.salesforce.com/services/oauth2/authorize",
  tokenUrl: "https://login.salesforce.com/services/oauth2/token",
  scopes: ["id", "api"],
  codeExchangeConfig: {
    modelCredentialsMapping: `{
      "access_token": access_token, 
      "expires_at": null,
      "refresh_token": refresh_token,
      "refresh_token_expires_at": null,
      "scope": scope,
      "token_type": token_type
    }`,
    isForm: true,
  },
}

import type { Connector } from "../types/connector.types.js"

export const mondayConnector: Connector = {
  authUrl: "https://auth.monday.com/oauth2/authorize",
  tokenUrl: "https://auth.monday.com/oauth2/token",
  scopes: ["boards:read", "me:read"],
  codeExchangeConfig: {
    modelCredentialsMapping: '{"access_token": access_token, "scope": scope}',
    isForm: false,
  },
}

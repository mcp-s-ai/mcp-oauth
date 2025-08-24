import type { Connector } from "../types/connector.types.js"

export const slackConnector: Connector = {
  authUrl: "https://slack.com/oauth/v2/authorize",
  tokenUrl: "https://slack.com/api/oauth.v2.access",
  scopes: [
    "channels:read",
    "chat:write",
    "users:read",
  ],
  codeExchangeConfig: {
    modelCredentialsMapping: '{"access_token": authed_user.access_token, "scope": authed_user.scope}',
    isForm: true,
  },
}

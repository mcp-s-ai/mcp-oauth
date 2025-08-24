import type { Connector } from "../types/connector.types.js"

export const jiraConnector: Connector = {
  authUrl: "https://auth.atlassian.com/authorize",
  tokenUrl: "https://auth.atlassian.com/oauth/token",
  scopes: ["read:jira-work"],
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
  authInitUrlParams: {
    audience: "api.atlassian.com",
    prompt: "consent",
  },
}

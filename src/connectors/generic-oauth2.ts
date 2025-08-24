import type { Connector } from "../types/connector.types.js"

/**
 * Generic OAuth 2.0 connector template
 * Customize this for any OAuth 2.0 provider
 */
export const createGenericOAuth2Connector = (config: {
  authUrl: string
  tokenUrl: string
  scopes?: string[]
  isForm?: boolean
  authInitUrlParams?: Record<string, string>
}): Connector => ({
  authUrl: config.authUrl,
  tokenUrl: config.tokenUrl,
  scopes: config.scopes || [],
  codeExchangeConfig: {
    // Standard OAuth 2.0 token response mapping
    modelCredentialsMapping: `{
            "access_token": access_token, 
            "expires_at": $fromMillis($millis() + expires_in * 1000),
            "refresh_token": refresh_token,
            "refresh_token_expires_at": null,
            "scope": scope,
            "token_type": token_type
          }`,
    isForm: config.isForm !== false, // Default to form-encoded
  },
  authInitUrlParams: config.authInitUrlParams || {},
})

// Example usage for popular providers:

export const discordConnector = createGenericOAuth2Connector({
  authUrl: "https://discord.com/api/oauth2/authorize",
  tokenUrl: "https://discord.com/api/oauth2/token",
  scopes: ["identify", "email"],
  isForm: true,
})

export const spotifyConnector = createGenericOAuth2Connector({
  authUrl: "https://accounts.spotify.com/authorize",
  tokenUrl: "https://accounts.spotify.com/api/token",
  scopes: ["user-read-private", "user-read-email"],
  isForm: true,
})

export const twitterConnector = createGenericOAuth2Connector({
  authUrl: "https://twitter.com/i/oauth2/authorize",
  tokenUrl: "https://api.twitter.com/2/oauth2/token",
  scopes: ["tweet.read", "users.read"],
  isForm: true,
  authInitUrlParams: {
    code_challenge_method: "S256",
  },
})

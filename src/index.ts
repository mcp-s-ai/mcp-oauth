// Export the main library function and types
export { McpOAuth } from "./lib.js"
export type {
  McpOAuthConfig,
  McpOAuthMiddleware,
} from "./types/library.types.js"

// Export commonly used types for convenience
export type { User } from "./types/clients.types.js"
export type { Connector, OAuthCredentials } from "./types/connector.types.js"

// Export utility functions that might be useful
// export { validateConfig, loadConfig } from "./libs/config.js" // TODO: Add config utilities

// Export built-in connectors
export { githubConnector } from "./connectors/github.js"
export { googleConnector } from "./connectors/google.js"
export { 
  createGenericOAuth2Connector,
  discordConnector,
  spotifyConnector,
  twitterConnector
} from "./connectors/generic-oauth2.js"

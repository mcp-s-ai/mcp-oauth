// Export the main library function and types
export { McpOAuth } from "./lib.js"
export type {
  McpOAuthConfig,
  McpOAuthMiddleware,
} from "./types/library.types.js"

// Export commonly used types for convenience
export type { Connector, OAuthCredentials } from "./types/connector.types.js"

// Export all connectors
export * from "./connectors/index.js"

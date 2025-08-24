// Export the main library function and types
export { McpOAuth } from "./lib.js"
export type {
  McpOAuthConfig,
  McpOAuthMiddleware,
} from "./types/library.types.js"

// Export commonly used types for convenience
export type { User } from "./types/clients.types.js"

// Export utility functions that might be useful
export { validateConfig, loadConfig } from "./libs/config.js"

import { Connector } from "./connector.types"

export interface McpOAuthConfig {
  /** Base URL for OAuth callbacks and redirects */
  baseUrl: string
  /** OAuth client ID */
  clientId: string
  /** OAuth client secret */
  clientSecret: string
  /** OAuth connector */
  connector: Connector
}

export interface McpOAuthMiddleware {
  router: import("express").Router
}

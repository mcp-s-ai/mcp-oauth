export interface McpOAuthConfig {
  /** Base URL for OAuth callbacks and redirects */
  baseUrl: string
  
  /** GitHub OAuth client ID */
  githubClientId: string
  
  /** GitHub OAuth client secret */
  githubClientSecret: string
  
  /** GitHub OAuth scopes (default: "read:user,user:email") */
  githubScopes?: string
}

export interface McpAuthInfo {
  /** OAuth access token (GitHub token) */
  token: string
  
  /** User information (fetch in your handler if needed) */
  user?: {
    login?: string
    name?: string
    email?: string
    [key: string]: any
  }
}

export interface McpRequest {
  /** Authentication information available on authenticated requests */
  auth: McpAuthInfo
  /** Express request object */
  headers: { [key: string]: string | string[] | undefined }
  body: any
  method: string
  url?: string
}

export type McpHandler = (req: McpRequest, res: import("express").Response) => void | Promise<void>

export interface McpOAuthMiddleware {
  /** Express router with all MCP OAuth endpoints */
  router: import("express").Router
}

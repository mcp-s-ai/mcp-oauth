import express from "express"
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js"
import { ProxyOAuthServerProvider } from "@modelcontextprotocol/sdk/server/auth/providers/proxyProvider.js"
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js"
import type { McpOAuthConfig, McpOAuthMiddleware, McpHandler } from "./types/library.types.js"

/**
 * Create MCP OAuth middleware for Express applications
 * This library ONLY handles OAuth authentication and provides an authenticated /mcp endpoint.
 * Users create their own MCP server inside the handler function.
 * 
 * @param config Configuration object for GitHub OAuth
 * @param mcpHandler Function to handle authenticated MCP requests - you create the MCP server here
 * @returns Express router with OAuth endpoints and authenticated /mcp endpoint
 */
export function McpOAuth(config: McpOAuthConfig, mcpHandler: McpHandler): McpOAuthMiddleware {
  // Validate required configuration
  if (!config.githubClientId || !config.githubClientSecret) {
    throw new Error("GitHub OAuth client ID and secret are required")
  }

  // Set up GitHub OAuth provider using Proxy Provider
  const githubProvider = new ProxyOAuthServerProvider({
    endpoints: {
      authorizationUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      revocationUrl: "https://github.com/settings/connections/applications/:client_id"
    },
    verifyAccessToken: async (token) => {
      // Verify the GitHub token by calling GitHub API
      try {
        const response = await fetch("https://api.github.com/user", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "MCP-OAuth-Library/1.0.0"
          }
        })
        
        if (response.ok) {
          const user = await response.json()
          return {
            token,
            clientId: config.githubClientId,
            scopes: config.githubScopes?.split(",") || ["read:user", "user:email"],
            userId: user.login
          }
        }
        
        throw new Error("Invalid token")
      } catch (error) {
        throw new Error("Token verification failed")
      }
    },
    getClient: async (clientId) => {
      if (clientId === config.githubClientId) {
        return {
          client_id: clientId,
          redirect_uris: [`${config.baseUrl}/auth/callback`],
          client_secret: config.githubClientSecret
        }
      }
      throw new Error("Unknown client")
    }
  })

  const router = express.Router()
  router.use(express.json())

  // Set up GitHub OAuth routes
  router.use('/auth', mcpAuthRouter({
    provider: githubProvider,
    issuerUrl: new URL(config.baseUrl),
    baseUrl: new URL(config.baseUrl),
  }))

  // MCP endpoint with authentication - this is where users create their MCP server
  router.all('/mcp', requireBearerAuth({ verifier: githubProvider }), async (req, res) => {
    // Extract auth info from the middleware
    const authInfo = (req as any).authInfo
    
    if (!authInfo?.token) {
      res.status(401).json({ error: "No authentication token provided" })
      return
    }

    // Create request with auth info for user handler
    const mcpReq = {
      ...req,
      auth: {
        token: authInfo.token,
        // Let the user fetch user info in their handler if they need it
        user: undefined
      }
    }

    // Call the user's MCP handler - they create their MCP server here
    try {
      await mcpHandler(mcpReq, res)
    } catch (error) {
      console.error("Error in MCP handler:", error)
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" })
      }
    }
  })

  // Health check endpoint
  router.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      library: 'mcp-oauth',
      version: '1.0.0'
    })
  })

  // Root endpoint with server info
  router.get('/', (req, res) => {
    res.json({
      name: "MCP OAuth Library",
      version: "1.0.0",
      description: "Express middleware for MCP with GitHub OAuth authentication",
      endpoints: {
        health: "/health",
        mcp: "/mcp (requires authentication)",
        auth: "/auth/*"
      },
      authentication: {
        provider: "github",
        authUrl: `${config.baseUrl}/auth/authorize`,
        tokenUrl: `${config.baseUrl}/auth/token`,
        callbackUrl: `${config.baseUrl}/auth/callback`
      },
      usage: "Create your MCP server inside the handler function passed to McpOAuth()"
    })
  })

  return {
    router
  }
}

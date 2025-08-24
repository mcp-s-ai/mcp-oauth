import express from "express"
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js"
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js"
import type {
  McpOAuthConfig,
  McpOAuthMiddleware,
} from "./types/library.types.js"
import { createMcpAuthProvider } from "./services/mcp-auth-provider.js"
import type { OAuthCredentials } from "./types/connector.types.js"
import { updateCredentials } from "./services/db.js"

/**
 * Exchange OAuth authorization code for access tokens using the connector's configuration
 */
async function exchangeOAuthCode(
  config: McpOAuthConfig,
  authorizationCode: string
): Promise<OAuthCredentials> {
  const { connector } = config
  
  if (!connector.tokenUrl) {
    throw new Error("Token URL not configured for this connector")
  }
  
  // Prepare the token exchange request
  const tokenParams = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: authorizationCode,
    redirect_uri: `${config.baseUrl}/authorized`,
    grant_type: "authorization_code",
  }
  
  // Make the token exchange request
  const isForm = connector.codeExchangeConfig?.isForm !== false // Default to true
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'MCP-OAuth/1.0'
  }
  
  let body: string
  if (isForm) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    body = new URLSearchParams(tokenParams).toString()
  } else {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(tokenParams)
  }
  
  const response = await fetch(connector.tokenUrl, {
    method: 'POST',
    headers,
    body,
  })
  
  if (!response.ok) {
    throw new Error(`OAuth token exchange failed: ${response.status} ${response.statusText}`)
  }
  
  const tokenResponse = await response.json()
  
  // Map the response to our OAuthCredentials format
  if (connector.codeExchangeConfig?.modelCredentialsMapping) {
    const mapping = connector.codeExchangeConfig.modelCredentialsMapping
    if (typeof mapping === 'function') {
      return mapping(tokenResponse)
    } else {
      // For string mapping, we'd need a JSONata library - for now, use a simple mapping
      return {
        access_token: tokenResponse.access_token,
        expires_at: tokenResponse.expires_in 
          ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
          : null,
        refresh_token: tokenResponse.refresh_token || null,
        refresh_token_expires_at: tokenResponse.refresh_token_expires_in
          ? new Date(Date.now() + tokenResponse.refresh_token_expires_in * 1000).toISOString()
          : null,
        scope: tokenResponse.scope || null,
        token_type: "Bearer",
      }
    }
  } else {
    // Default mapping
    return {
      access_token: tokenResponse.access_token,
      expires_at: tokenResponse.expires_in 
        ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
        : null,
      refresh_token: tokenResponse.refresh_token || null,
      refresh_token_expires_at: null,
      scope: tokenResponse.scope || null,
      token_type: "Bearer",
    }
  }
}



/**
 * Create MCP OAuth middleware for Express applications
 * This library ONLY handles OAuth authentication and provides an authenticated /mcp endpoint.
 * Users create their own MCP server inside the handler function.
 *
 * @param config Configuration object for GitHub OAuth
 * @param mcpHandler Function to handle authenticated MCP requests - you create the MCP server here
 * @returns Express router with OAuth endpoints and authenticated /mcp endpoint
 */
export function McpOAuth(
  config: McpOAuthConfig,
  mcpHandler: express.RequestHandler,
): McpOAuthMiddleware {
  const mcpAuthProvider = createMcpAuthProvider(config)

  const router = express.Router()
  router.use(express.json())

  // Set up GitHub OAuth routes
  router.use(
    mcpAuthRouter({
      provider: mcpAuthProvider,
      issuerUrl: new URL(config.baseUrl),
      baseUrl: new URL(config.baseUrl),
    }),
  )

  router.get("/oauth/callback", async (req, res) => {
    try {
      console.log("authorized", req.query)
      
      const { code: oauthCode, state: stateJson } = req.query
      
      if (!oauthCode || !stateJson) {
        return res.status(400).json({ error: "Missing required parameters" })
      }
      
      // Parse the state to get our internal data
      const stateData = JSON.parse(stateJson as string)
      const { originalState, code: internalCode, clientId, redirectUri } = stateData
      
      // Step 1: Exchange OAuth provider's authorization code for their access tokens
      const oauthCredentials = await exchangeOAuthCode(config, oauthCode as string)
      
      // Step 2: Complete our internal MCP OAuth flow
      const mcpCredentials = await mcpAuthProvider.exchangeAuthorizationCode(
        { 
          client_id: clientId,
          redirect_uris: [`${config.baseUrl}/oauth/callback`]
        },
        internalCode
      )
      
      // Step 3: Store both sets of credentials together
      const formattedMcpCredentials = {
        access_token: mcpCredentials.access_token,
        token_type: mcpCredentials.token_type as "Bearer",
        access_token_expired_at: 'expires_in' in mcpCredentials && mcpCredentials.expires_in 
          ? Date.now() + mcpCredentials.expires_in * 1000
          : Date.now() + 3600000,
        scope: mcpCredentials.scope || "openid email profile",
        refresh_token: mcpCredentials.refresh_token || "",
      }
      
      updateCredentials({
        client_id: clientId,
        credentials: formattedMcpCredentials,
        oauth_credentials: oauthCredentials,
      })
      
      // Step 4: Redirect back to the original redirect URI with our internal code and state
      const finalRedirectUrl = new URL(redirectUri)
      finalRedirectUrl.searchParams.set("code", internalCode)
      if (originalState) {
        finalRedirectUrl.searchParams.set("state", originalState)
      }
      
      res.redirect(finalRedirectUrl.toString())
    } catch (error) {
      console.error("Error in authorized endpoint:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  })

  // MCP endpoint with authentication - this is where users create their MCP server
  router.all(
    "/mcp",
    requireBearerAuth({ verifier: mcpAuthProvider }),
    async (req, res, next) => {
      // Call the user's MCP handler - they create their MCP server here
      try {
        await mcpHandler(req, res, next)
      } catch (error) {
        console.error("Error in MCP handler:", error)
        if (!res.headersSent) {
          res.status(500).json({ error: "Internal server error" })
        }
      }
    },
  )

  return {
    router,
  }
}

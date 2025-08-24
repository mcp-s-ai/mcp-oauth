import express from "express"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"
import { randomUUID } from "node:crypto"
import { McpOAuth } from "./lib.js"
import type { McpOAuthConfig, McpRequest } from "./types/library.types.js"
import { loadConfig, validateConfig } from "./libs/config.js"

// Load environment variables
loadConfig()
validateConfig()

async function startExampleServer() {
  const app = express()

  // Environment configuration
  const config: McpOAuthConfig = {
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
    githubClientId: process.env.GITHUB_CLIENT_ID!,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET!,
    githubScopes: "read:user,user:email"
  }

  // Validate required environment variables
  if (!config.githubClientId || !config.githubClientSecret) {
    console.error("❌ Missing required environment variables:")
    if (!config.githubClientId) console.error("   - GITHUB_CLIENT_ID")
    if (!config.githubClientSecret) console.error("   - GITHUB_CLIENT_SECRET")
    process.exit(1)
  }

  // Store transports by session ID
  const transports: Record<string, StreamableHTTPServerTransport> = {}

  // Define MCP handler function - THIS IS WHERE YOU CREATE YOUR MCP SERVER
  const mcpHandler = async (req: McpRequest, res: express.Response) => {
    console.log("Authenticated MCP request from user:", req.auth.user?.login)

    // Check for existing session ID
    const sessionId = req.headers["mcp-session-id"] as string | undefined
    let transport: StreamableHTTPServerTransport

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId]
    } else {
      // Create new transport
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          console.log(`New MCP session initialized: ${sessionId}`)
          transports[sessionId] = transport
        }
      })

      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          console.log(`MCP session closed: ${transport.sessionId}`)
          delete transports[transport.sessionId]
        }
      }

      // Create MCP Server with your tools
      const mcpServer = new Server(
        {
          name: "github-mcp-server",
          version: "1.0.0"
        },
        {
          capabilities: {
            tools: {}
          }
        }
      )

      // Setup tools
      mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
          tools: [
            {
              name: "github_me",
              description: "Get the authenticated user's GitHub profile information",
              inputSchema: {
                type: "object",
                properties: {},
                additionalProperties: false
              }
            }
          ]
        }
      })

      mcpServer.setRequestHandler(CallToolRequestSchema, async (request, { authInfo }) => {
        const { name } = request.params
        
        if (name === "github_me") {
          try {
            // Call GitHub API using the OAuth token from req.auth
            const response = await fetch("https://api.github.com/user", {
              headers: {
                "Authorization": `Bearer ${req.auth.token}`,
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "MCP-OAuth-Example/1.0.0"
              }
            })

            if (!response.ok) {
              return {
                content: [
                  {
                    type: "text", 
                    text: `GitHub API error: ${response.status} ${response.statusText}`
                  }
                ],
                isError: true
              }
            }

            const userData = await response.json()
            
            return {
              content: [
                {
                  type: "text",
                  text: `GitHub User Profile:
Name: ${userData.name || "Not provided"}
Username: ${userData.login}
Email: ${userData.email || "Not public"}
Bio: ${userData.bio || "No bio"}
Public Repos: ${userData.public_repos}
Followers: ${userData.followers}
Following: ${userData.following}
Created: ${userData.created_at}
Updated: ${userData.updated_at}
Profile URL: ${userData.html_url}`
                }
              ]
            }
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error fetching GitHub user data: ${error instanceof Error ? error.message : "Unknown error"}`
                }
              ],
              isError: true
            }
          }
        }

        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`
            }
          ],
          isError: true
        }
      })

      // Connect server to transport
      await mcpServer.connect(transport)
    }

    // Handle the request using the original express request
    await transport.handleRequest(req as any, res, req.body)
  }

  // Create MCP OAuth middleware - JUST PASS THE HANDLER
  const mcpOAuth = McpOAuth(config, mcpHandler)

  // Mount MCP OAuth middleware
  app.use("/", mcpOAuth.router)

  // Custom application routes
  app.get("/api/example", (req, res) => {
    res.json({ 
      message: "This is a custom route in your application",
      timestamp: new Date().toISOString()
    })
  })

  const port = parseInt(process.env.PORT || "3000")
  const server = app.listen(port, () => {
    console.log(`🚀 Example MCP OAuth Server running on http://localhost:${port}`)
    console.log(`📖 Endpoints:`)
    console.log(`   - GET  /health        - Health check`)
    console.log(`   - GET  /             - Server info`)
    console.log(`   - ALL  /mcp          - MCP endpoint (requires auth)`)
    console.log(`   - *    /auth/*       - OAuth endpoints`)
    console.log(`   - GET  /api/example  - Custom application route`)
    console.log(``)
    console.log(`🔐 OAuth Configuration:`)
    console.log(`   - Provider: GitHub`)
    console.log(`   - Client ID: ${config.githubClientId}`)
    console.log(`   - Authorize URL: ${config.baseUrl}/auth/authorize`)
    console.log(`   - Token URL: ${config.baseUrl}/auth/token`)
    console.log(``)
    console.log(`🛠️ Available Tools:`)
    console.log(`   - github_me: Get authenticated user's GitHub profile`)
    console.log(``)
    console.log(`💡 This is an example of using the MCP OAuth library`)
    console.log(`   The library handles OAuth, you create MCP server in the handler`)
  })

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\nShutting down example server...")
    
    // Close all transports
    await Promise.all(
      Object.values(transports).map(transport => {
        try {
          transport.close?.()
          return Promise.resolve()
        } catch (error) {
          console.error("Error closing transport:", error)
          return Promise.resolve()
        }
      })
    )
    
    server.close(() => {
      console.log("Server closed.")
      process.exit(0)
    })
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)

  return server
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startExampleServer().catch((error) => {
    console.error("Failed to start example server:", error)
    process.exit(1)
  })
}

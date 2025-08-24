# MCP S OAuth

Universal OAuth middleware library for MCP (Model Context Protocol) servers with support for any OAuth provider.

## Overview

This library provides OAuth authentication for MCP servers using a flexible connector pattern. It handles the complete OAuth flow for any OAuth provider and provides an authenticated `/mcp` endpoint where you create your own MCP server with tools. Built using the official [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk?tab=readme-ov-file#streamable-http).

## Features

- 🔐 **Universal OAuth Support** - Works with GitHub, Google, and any OAuth 2.0 provider
- 🔌 **Connector Pattern** - Easily add support for new OAuth providers
- 🚀 **Express Middleware** - Simple integration with `app.use()`
- 🛠️ **Bring Your Own MCP Server** - Create MCP server in your handler function
- 📊 **Session Management** - Automatic session handling via MCP SDK
- 🌐 **Authenticated Context** - Access OAuth tokens in your tools
- 🎯 **Production Ready** - Built with official MCP SDK components

## Installation

```bash
npm install
```

## Quick Start

### Basic Usage

```typescript
import express from "express"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { McpOAuth } from "mcp-s-oauth"
import type { McpOAuthConfig } from "mcp-s-oauth"

const app = express()

// Choose your OAuth provider connector
import { githubConnector } from "mcp-s-oauth"
// or import { googleConnector } from "mcp-s-oauth"
// or create your own custom connector

// Configure OAuth with any provider
const config: McpOAuthConfig = {
  baseUrl: "http://localhost:3000",
  clientId: "your-oauth-client-id",
  clientSecret: "your-oauth-client-secret",
  connector: githubConnector  // or any other connector
}

// Create your MCP handler - this is where YOU create the MCP server
const mcpHandler = async (req: express.Request, res: express.Response, { authInfo }) => {
  // Access the OAuth token from any provider
  const oauthToken = authInfo.token
  
  // Create transport and your MCP server
  const transport = new StreamableHTTPServerTransport(/* options */)
  const mcpServer = new Server({ name: "my-server", version: "1.0.0" })
  
  // Register your tools (customize based on your OAuth provider)
  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
      name: "get_profile",
      description: "Get authenticated user profile",
      inputSchema: { type: "object" }
    }]
  }))
  
  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "get_profile") {
      // Call your OAuth provider's API using the token
      // Example for GitHub: https://api.github.com/user
      // Example for Google: https://www.googleapis.com/oauth2/v2/userinfo
      const apiUrl = "https://api.github.com/user" // adjust for your provider
      
      const response = await fetch(apiUrl, {
        headers: { "Authorization": `Bearer ${authInfo.token}` }
      })
      const userData = await response.json()
      
      return {
        content: [{ type: "text", text: `Profile: ${JSON.stringify(userData, null, 2)}` }]
      }
    }
  })
  
  // Handle the MCP request
  await mcpServer.connect(transport)
  await transport.handleRequest(req, res, req.body)
}

// Use the library
const mcpOAuth = McpOAuth(config, mcpHandler)
app.use("/", mcpOAuth.router)

app.listen(3000)
```

### Environment Setup

```bash
# OAuth Provider Credentials (required - use one set)
# For GitHub:
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# For Google:
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# For any OAuth provider:
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret

# Server config (optional)
BASE_URL=http://localhost:3000
PORT=3000
```

## OAuth Provider Setup

### GitHub OAuth App Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App:
   - **Authorization callback URL**: `${baseUrl}/oauth/callback` (e.g., `http://localhost:3000/oauth/callback`)
3. Use the Client ID and Secret in your config

### Google OAuth App Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the "Google+ API" or "People API"
4. Create OAuth 2.0 credentials:
   - **Authorized redirect URIs**: `${baseUrl}/oauth/callback` (e.g., `http://localhost:3000/oauth/callback`)
5. Use the Client ID and Secret in your config

### Custom OAuth Provider Setup

For any OAuth 2.0 provider, you'll need:
1. Client ID and Client Secret from your provider
2. Authorization callback URL set to: `${baseUrl}/oauth/callback`

## Connector Examples

The library uses a connector pattern to support any OAuth provider. Here are examples:

### GitHub Connector

```typescript
import { githubConnector } from "mcp-s-oauth"

const config: McpOAuthConfig = {
  baseUrl: "http://localhost:3000",
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  connector: githubConnector,
}
```

### Google Connector

```typescript
import { googleConnector } from "mcp-s-oauth"

const config: McpOAuthConfig = {
  baseUrl: "http://localhost:3000",
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  connector: googleConnector,
}
```

### Discord Connector

```typescript
import { discordConnector } from "mcp-s-oauth"

const config: McpOAuthConfig = {
  baseUrl: "http://localhost:3000",
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  connector: discordConnector,
}
```

### Custom Connector

```typescript
import type { Connector } from "mcp-s-oauth"

const myCustomConnector: Connector = {
  authUrl: "https://your-provider.com/oauth/authorize",
  tokenUrl: "https://your-provider.com/oauth/token",
  scopes: ["read", "write"],
  codeExchangeConfig: {
    isForm: true,
    modelCredentialsMapping: `{
      "access_token": access_token, 
      "expires_at": $fromMillis($millis() + expires_in * 1000),
      "refresh_token": refresh_token,
      "scope": scope,
      "token_type": token_type
    }`,
  },
  authInitUrlParams: {
    prompt: "consent",
  },
}
```

## Creating Custom Connectors

The `Connector` interface allows you to integrate any OAuth 2.0 provider. Here's how to create your own:

### Connector Interface

```typescript
export interface Connector {
  authUrl?: string                    // OAuth authorization endpoint
  tokenUrl?: string                   // OAuth token exchange endpoint  
  refreshTokenUrl?: string            // Token refresh endpoint (defaults to tokenUrl)
  scopes?: string[] | readonly string[] // OAuth scopes to request
  codeExchangeConfig?: {
    modelCredentialsMapping?: JsonataString<OAuthCredentials> | ((config: any) => OAuthCredentials)
    isForm?: boolean                  // Use form encoding vs JSON for token exchange
    authorizationMapping?: JsonataString<string> | ((config: any) => string)
  }
  authInitUrlParams?: Record<string, string> // Additional OAuth params
}
```

### Step-by-Step Guide

1. **Find OAuth Documentation** for your provider (authorization URL, token URL, scopes)

2. **Create Connector File**:
```typescript
// src/connectors/my-provider.ts
import type { Connector } from "../types/connector.types.js"

export const myProviderConnector: Connector = {
  authUrl: "https://api.myprovider.com/oauth/authorize",
  tokenUrl: "https://api.myprovider.com/oauth/token", 
  scopes: ["read", "write"],
  codeExchangeConfig: {
    isForm: true, // Most providers use form encoding
    modelCredentialsMapping: `{
      "access_token": access_token, 
      "expires_at": $fromMillis($millis() + expires_in * 1000),
      "refresh_token": refresh_token,
      "scope": scope,
      "token_type": token_type
    }`,
  },
}
```

3. **Handle Special Cases**:

```typescript
// Provider requires special auth parameters
export const specialProviderConnector: Connector = {
  authUrl: "https://special.com/oauth/authorize",
  tokenUrl: "https://special.com/oauth/token",
  scopes: ["user:read"],
  authInitUrlParams: {
    access_type: "offline",
    prompt: "consent",
    response_mode: "query",
  },
  codeExchangeConfig: {
    isForm: false, // This provider uses JSON
  },
}
```

4. **Use Function for Complex Mapping**:

```typescript
export const complexProviderConnector: Connector = {
  authUrl: "https://complex.com/oauth/authorize",
  tokenUrl: "https://complex.com/oauth/token",
  scopes: ["api"],
  codeExchangeConfig: {
    isForm: true,
    // Use function for complex response mapping
    modelCredentialsMapping: (tokenResponse) => ({
      access_token: tokenResponse.accessToken, // Different field name
      expires_at: new Date(Date.now() + tokenResponse.expiresIn * 1000).toISOString(),
      refresh_token: tokenResponse.refreshToken,
      refresh_token_expires_at: null,
      scope: tokenResponse.scope,
      token_type: "Bearer",
    }),
  },
}
```

### Common OAuth Patterns

| Provider | Auth URL | Token URL | Form Encoding | Special Notes |
|----------|----------|-----------|---------------|---------------|
| GitHub | `/login/oauth/authorize` | `/login/oauth/access_token` | ❌ JSON | Simple flow |
| Google | `/o/oauth2/v2/auth` | `/oauth2/token` | ✅ Form | Use `access_type: offline` |
| Discord | `/api/oauth2/authorize` | `/api/oauth2/token` | ✅ Form | Standard OAuth |
| Twitter | `/i/oauth2/authorize` | `/2/oauth2/token` | ✅ Form | Requires PKCE |
| LinkedIn | `/authorization` | `/accessToken` | ✅ Form | Different field names |

### Testing Your Connector

1. **Create test config**:
```typescript
const config: McpOAuthConfig = {
  baseUrl: "http://localhost:3000",
  clientId: process.env.MY_PROVIDER_CLIENT_ID!,
  clientSecret: process.env.MY_PROVIDER_CLIENT_SECRET!,
  connector: myProviderConnector,
}
```

2. **Test OAuth flow**:
   - Visit `/auth/authorize`
   - Complete OAuth on provider
   - Check console logs for token exchange
   - Test API calls with the token

3. **Common Issues**:
   - **Form vs JSON**: Check provider docs for token endpoint format
   - **Field Names**: Response might use different field names
   - **Scopes**: Ensure scopes are valid for your provider
   - **Callback URL**: Must match OAuth app configuration

## Example Tools by Provider

The tools you create depend on your OAuth provider and their APIs. The library provides the OAuth token - you implement the tools. Here are examples:

### GitHub Tools

```typescript
// In your mcpHandler function
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "github_me",
      description: "Get authenticated user's GitHub profile",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "github_repos",
      description: "List user's repositories",
      inputSchema: { 
        type: "object",
        properties: {
          type: { type: "string", enum: ["all", "owner", "member"] }
        }
      }
    }
  ]
}))

mcpServer.setRequestHandler(CallToolRequestSchema, async (request, { authInfo }) => {
  if (request.params.name === "github_me") {
    const response = await fetch("https://api.github.com/user", {
      headers: { "Authorization": `Bearer ${authInfo.token}` }
    })
    return { content: [{ type: "text", text: await response.text() }] }
  }
  
  if (request.params.name === "github_repos") {
    const { type = "all" } = request.params.arguments || {}
    const response = await fetch(`https://api.github.com/user/repos?type=${type}`, {
      headers: { "Authorization": `Bearer ${authInfo.token}` }
    })
    return { content: [{ type: "text", text: await response.text() }] }
  }
})
```

### Google Tools

```typescript
// In your mcpHandler function
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "google_profile",
      description: "Get Google user profile",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "google_calendar",
      description: "List calendar events",
      inputSchema: { type: "object", properties: {} }
    }
  ]
}))

mcpServer.setRequestHandler(CallToolRequestSchema, async (request, { authInfo }) => {
  if (request.params.name === "google_profile") {
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { "Authorization": `Bearer ${authInfo.token}` }
    })
    return { content: [{ type: "text", text: await response.text() }] }
  }
  
  if (request.params.name === "google_calendar") {
    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      headers: { "Authorization": `Bearer ${authInfo.token}` }
    })
    return { content: [{ type: "text", text: await response.text() }] }
  }
})
```

### Discord Tools

```typescript
// In your mcpHandler function
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "discord_me",
      description: "Get Discord user info",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "discord_guilds",
      description: "List user's Discord servers",
      inputSchema: { type: "object", properties: {} }
    }
  ]
}))

mcpServer.setRequestHandler(CallToolRequestSchema, async (request, { authInfo }) => {
  if (request.params.name === "discord_me") {
    const response = await fetch("https://discord.com/api/users/@me", {
      headers: { "Authorization": `Bearer ${authInfo.token}` }
    })
    return { content: [{ type: "text", text: await response.text() }] }
  }
  
  if (request.params.name === "discord_guilds") {
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { "Authorization": `Bearer ${authInfo.token}` }
    })
    return { content: [{ type: "text", text: await response.text() }] }
  }
})
```

## MCP Client Usage

### Using with MCP Clients

Your OAuth-authenticated MCP server implements the [MCP (Model Context Protocol)](https://modelcontextprotocol.io) and can be used with any MCP-compatible client:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"

const client = new Client({
  name: "oauth-mcp-client",
  version: "1.0.0"
})

const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3000/mcp")
)

await client.connect(transport)

// List available tools (depends on your implementation)
const tools = await client.listTools()
console.log("Available tools:", tools)

// Call any tool you've implemented
const result = await client.callTool({
  name: "get_profile", // or any tool name you've implemented
  arguments: {}
})
console.log("Result:", result)
```

### Authentication Flow

1. **Start OAuth Flow**: Make a request to `/auth/authorize` to initiate OAuth with your provider
2. **User Authorization**: User is redirected to OAuth provider to authorize your application
3. **Token Exchange**: Provider redirects back with an authorization code
4. **MCP Access**: Use the obtained token to make authenticated MCP requests to `/mcp`

## API Reference

### Server Information

- **GET /** - Server information, available tools, and authentication endpoints
- **GET /health** - Health check endpoint

### Authentication Endpoints

- **POST /auth/authorize** - Start OAuth flow with configured provider
- **POST /auth/token** - Exchange authorization code for access token  
- **GET /oauth/callback** - OAuth callback handler (used by the provider)

### MCP Protocol

- **ALL /mcp** - Main MCP endpoint supporting all MCP protocol methods
  - Requires Bearer token authentication
  - Supports session management with `mcp-session-id` header
  - Handles tools/list and tools/call requests
  - Returns tools you've implemented in your mcpHandler

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OAUTH_CLIENT_ID` | ✅ | OAuth provider client ID | `abc123def456` |
| `OAUTH_CLIENT_SECRET` | ✅ | OAuth provider client secret | `secret123` |
| `GITHUB_CLIENT_ID` | ✅* | GitHub client ID (if using GitHub) | `abc123def456` |
| `GITHUB_CLIENT_SECRET` | ✅* | GitHub client secret (if using GitHub) | `secret123` |
| `GOOGLE_CLIENT_ID` | ✅* | Google client ID (if using Google) | `123-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ✅* | Google client secret (if using Google) | `GOCSPX-secret123` |
| `BASE_URL` | ❌ | Base URL for OAuth callbacks | `http://localhost:3000` |
| `PORT` | ❌ | Port to run the server on | `3000` |
| `AUTH_SECRET` | ❌ | Secret for token signing (optional) | `random-secret-key` |

*Required only if using that specific provider

## Testing the Server

### Manual Testing

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Check server info**:
   ```bash
   curl http://localhost:3000/
   ```

3. **Health check**:
   ```bash
   curl http://localhost:3000/health
   ```

4. **Test OAuth flow**:
   - Visit `http://localhost:3000/auth/authorize` in your browser
   - Complete OAuth authorization with your provider
   - Use the returned token for MCP requests

### MCP Client Testing

Test the MCP server using the official SDK client:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"

// Connect to the server
const client = new Client({ name: "test-client", version: "1.0.0" })
const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3000/mcp"),
  {
    requestInit: {
      headers: {
        'Authorization': 'Bearer your-oauth-token-here'
      }
    }
  }
)

await client.connect(transport)

// Test listing tools
const tools = await client.listTools()
console.log("Available tools:", tools.tools)

// Test calling any tool you've implemented
const result = await client.callTool({
  name: "get_profile", // or any tool name you've implemented
  arguments: {}
})
console.log("Result:", result.content)
```

## Development

### Project Structure

```
src/
├── server.ts              # Main MCP server implementation
├── libs/
│   ├── config.ts          # Environment configuration
│   ├── auth.ts            # Authentication utilities
│   ├── session.ts         # Session management
│   └── tokens.ts          # Token utilities
├── services/
│   └── db.ts              # Database operations
└── types/
    ├── auth.types.ts      # Authentication types
    └── clients.types.ts   # Client types
```

### Building and Running

```bash
# Install dependencies
npm install

# Development mode with auto-reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Adding New Tools

To add new MCP tools to your server:

1. **Update the tools list** in `ListToolsRequestSchema` handler
2. **Add tool implementation** in `CallToolRequestSchema` handler  
3. **Use the OAuth token** to call your provider's APIs

Example (provider-agnostic):
```typescript
// In ListToolsRequestSchema handler
{
  name: "get_user_data",
  description: "Get user data from OAuth provider",
  inputSchema: {
    type: "object",
    properties: {
      fields: {
        type: "array",
        items: { type: "string" },
        description: "Fields to retrieve"
      }
    }
  }
}

// In CallToolRequestSchema handler
if (name === "get_user_data") {
  const { fields = [] } = request.params.arguments || {}
  
  // Use the OAuth token to call your provider's API
  const apiUrl = "https://api.your-provider.com/user" // adjust for your provider
  const response = await fetch(apiUrl, {
    headers: {
      "Authorization": `Bearer ${authInfo.token}`,
      "Accept": "application/json"
    }
  })
  
  const userData = await response.json()
  
  return {
    content: [{ 
      type: "text", 
      text: JSON.stringify(userData, null, 2)
    }]
  }
}
```

## Security Considerations

1. **OAuth Secrets**: Never commit OAuth client secrets to version control
2. **HTTPS**: Use HTTPS in production for secure OAuth flows  
3. **Environment Variables**: Store all sensitive configuration in environment variables
4. **Token Storage**: Tokens are managed by the MCP SDK OAuth provider
5. **OAuth App Configuration**: Configure your OAuth app with correct callback URLs
6. **Scope Limitation**: Request only the OAuth scopes your application needs
7. **Token Validation**: The library handles token validation automatically

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure your OAuth provider's `CLIENT_ID` and `CLIENT_SECRET` are set
   - Check environment variable names match your configuration

2. **OAuth callback errors**
   - Verify your `BASE_URL` matches your OAuth app configuration
   - Check that Authorization callback URL is set to `${baseUrl}/oauth/callback`
   - Ensure your OAuth provider app is configured correctly

3. **Token exchange errors**
   - Check `isForm` setting in your connector - most providers use form encoding
   - Verify `tokenUrl` is correct for your provider
   - Check if provider requires special headers or parameters

4. **API rate limits**
   - Authenticated requests usually have higher rate limits
   - Consider implementing caching for frequently accessed data
   - Check your provider's rate limiting documentation

5. **MCP client connection issues**
   - Ensure you're using the correct MCP endpoint URL: `/mcp`
   - Verify Bearer token authentication is properly configured
   - Check that your tools are properly registered in the mcpHandler

6. **Connector issues**
   - Verify OAuth URLs are correct for your provider
   - Check scopes are valid for your provider
   - Test OAuth flow manually in browser first

### Debug Mode

Enable detailed logging by setting environment variables:

```bash
DEBUG=mcp:*
NODE_ENV=development
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📚 [Documentation](https://github.com/mcp-s-ai/mcp-s-oauth/wiki)
- 🐛 [Issues](https://github.com/mcp-s-ai/mcp-s-oauth/issues)
- 💬 [Discussions](https://github.com/mcp-s-ai/mcp-s-oauth/discussions)

## Related Projects

- [Model Context Protocol](https://github.com/modelcontextprotocol)
- [MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Express.js](https://expressjs.com)

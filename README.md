# MCP OAuth

Express middleware library for MCP (Model Context Protocol) with GitHub OAuth authentication.

## Overview

This library provides GitHub OAuth authentication for MCP servers. It handles the entire OAuth flow and provides an authenticated `/mcp` endpoint where you create your own MCP server with tools. Built using the official [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk?tab=readme-ov-file#streamable-http).

## Features

- 🔐 **GitHub OAuth Authentication** - Complete OAuth flow handling
- 🚀 **Express Middleware** - Simple integration with `app.use()`
- 🛠️ **Bring Your Own MCP Server** - Create MCP server in your handler function
- 📊 **Session Management** - Automatic session handling via MCP SDK
- 🌐 **Authenticated Context** - Access GitHub token in your tools
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
import { McpOAuth } from "mcp-oauth"
import type { McpOAuthConfig, McpRequest } from "mcp-oauth"

const app = express()

// Configure OAuth
const config: McpOAuthConfig = {
  baseUrl: "http://localhost:3000",
  githubClientId: "your-github-client-id",
  githubClientSecret: "your-github-client-secret"
}

// Create your MCP handler - this is where YOU create the MCP server
const mcpHandler = async (req: McpRequest, res: express.Response) => {
  // Library only provides req.auth.token - YOU make the API calls
  
  // Create transport and your MCP server
  const transport = new StreamableHTTPServerTransport(/* options */)
  const mcpServer = new Server({ name: "my-server", version: "1.0.0" })
  
  // Register your tools
  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
      name: "github_me",
      description: "Get GitHub user profile",
      inputSchema: { type: "object" }
    }]
  }))
  
  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "github_me") {
      // YOU call GitHub API using the token from library
      const response = await fetch("https://api.github.com/user", {
        headers: { "Authorization": `Bearer ${req.auth.token}` }
      })
      const userData = await response.json()
      
      return {
        content: [{ type: "text", text: `Hello ${userData.login}!` }]
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
# GitHub OAuth (required)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Server config (optional)
BASE_URL=http://localhost:3000
PORT=3000
```

### GitHub OAuth App Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App:
   - **Authorization callback URL**: `http://localhost:3000/auth/callback`
3. Use the Client ID and Secret in your config

## Available Tools

### `github_me`

Gets the authenticated user's GitHub profile information using the [GitHub Users API](https://docs.github.com/en/rest/users/users#get-the-authenticated-user).

**Input Schema:**
```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

**Example Response:**
```
GitHub User Profile:
Name: John Doe
Username: johndoe
Email: john@example.com
Bio: Software Developer
Public Repos: 42
Followers: 123
Following: 456
Created: 2020-01-15T10:30:00Z
Updated: 2024-01-15T08:45:00Z
Profile URL: https://github.com/johndoe
```

## MCP Client Usage

### Using with MCP Clients

This server implements the [MCP (Model Context Protocol)](https://modelcontextprotocol.io) and can be used with any MCP-compatible client:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"

const client = new Client({
  name: "github-mcp-client",
  version: "1.0.0"
})

const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:3000/mcp")
)

await client.connect(transport)

// List available tools
const tools = await client.listTools()
console.log("Available tools:", tools)

// Call the github_me tool
const result = await client.callTool({
  name: "github_me",
  arguments: {}
})
console.log("User profile:", result)
```

### Authentication Flow

1. **Start OAuth Flow**: Make a request to `/auth/authorize` to initiate GitHub OAuth
2. **User Authorization**: User is redirected to GitHub to authorize your application
3. **Token Exchange**: GitHub redirects back with an authorization code
4. **MCP Access**: Use the obtained token to make authenticated MCP requests to `/mcp`

## API Reference

### Server Information

- **GET /** - Server information, available tools, and authentication endpoints
- **GET /health** - Health check endpoint

### Authentication Endpoints

- **POST /auth/authorize** - Start GitHub OAuth flow
- **POST /auth/token** - Exchange authorization code for access token  
- **GET /auth/callback** - OAuth callback handler

### MCP Protocol

- **ALL /mcp** - Main MCP endpoint supporting all MCP protocol methods
  - Requires Bearer token authentication
  - Supports session management with `mcp-session-id` header
  - Handles tools/list and tools/call requests

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GITHUB_CLIENT_ID` | ✅ | GitHub OAuth client ID | `abc123def456` |
| `GITHUB_CLIENT_SECRET` | ✅ | GitHub OAuth client secret | `secret123` |
| `BASE_URL` | ❌ | Base URL for OAuth callbacks | `http://localhost:3000` |
| `PORT` | ❌ | Port to run the server on | `3000` |
| `AUTH_SECRET` | ❌ | Secret for token signing (optional) | `random-secret-key` |

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
   - Complete GitHub OAuth authorization
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
        'Authorization': 'Bearer your-github-oauth-token-here'
      }
    }
  }
)

await client.connect(transport)

// Test listing tools
const tools = await client.listTools()
console.log("Available tools:", tools.tools)

// Test calling github_me tool
const result = await client.callTool({
  name: "github_me",
  arguments: {}
})
console.log("GitHub profile:", result.content)
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

To add new MCP tools to the server:

1. **Update the tools list** in `ListToolsRequestSchema` handler
2. **Add tool implementation** in `CallToolRequestSchema` handler
3. **Update documentation** in this README

Example:
```typescript
// In ListToolsRequestSchema handler
{
  name: "github_repos",
  description: "List user's GitHub repositories",
  inputSchema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["all", "owner", "member"],
        description: "Repository type filter"
      }
    }
  }
}

// In CallToolRequestSchema handler
if (name === "github_repos") {
  const { type = "all" } = request.params.arguments || {}
  const response = await fetch(`https://api.github.com/user/repos?type=${type}`, {
    headers: {
      "Authorization": `Bearer ${authInfo.token}`,
      "Accept": "application/vnd.github.v3+json"
    }
  })
  // ... handle response
}
```

## Security Considerations

1. **OAuth Secrets**: Never commit GitHub client secrets to version control
2. **HTTPS**: Use HTTPS in production for secure OAuth flows  
3. **Environment Variables**: Store all sensitive configuration in environment variables
4. **Token Storage**: Tokens are managed by the MCP SDK OAuth provider
5. **OAuth App Configuration**: Configure your GitHub OAuth app with correct callback URLs

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set
   - Copy from GitHub Developer Settings OAuth Apps

2. **OAuth callback errors**
   - Verify your `BASE_URL` matches your GitHub OAuth app configuration
   - Check that Authorization callback URL is set to `{BASE_URL}/auth/callback`

3. **GitHub API rate limits**
   - Authenticated requests have higher rate limits
   - Consider implementing caching for frequently accessed data

4. **MCP client connection issues**
   - Ensure you're using the correct MCP endpoint URL
   - Verify Bearer token authentication is properly configured

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

- 📚 [Documentation](https://github.com/mcp-s-ai/mcp-oauth/wiki)
- 🐛 [Issues](https://github.com/mcp-s-ai/mcp-oauth/issues)
- 💬 [Discussions](https://github.com/mcp-s-ai/mcp-oauth/discussions)

## Related Projects

- [Model Context Protocol](https://github.com/modelcontextprotocol)
- [MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Express.js](https://expressjs.com)

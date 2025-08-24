#!/usr/bin/env npx tsx

import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"

/**
 * Simple test client for the MCP OAuth library example
 * 
 * Usage:
 *   1. Start the example server: npm run dev
 *   2. Get a GitHub token from /auth/authorize flow
 *   3. Run: npx tsx test-client.ts <github-token>
 */
async function testMcpServer() {
  const token = process.argv[2]
  
  if (!token) {
    console.error("❌ Please provide a GitHub OAuth token")
    console.log("Usage: npx tsx test-client.ts <github-token>")
    console.log("\nTo get a token:")
    console.log("1. Start the server: npm run dev")
    console.log("2. Visit: http://localhost:3000/auth/authorize")
    console.log("3. Complete GitHub OAuth and copy the token")
    process.exit(1)
  }

  console.log("🚀 Testing MCP OAuth Library Example...")

  try {
    // Create client and connect
    const client = new Client({
      name: "test-client",
      version: "1.0.0"
    })

    const transport = new StreamableHTTPClientTransport(
      new URL("http://localhost:3000/mcp"),
      {
        requestInit: {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      }
    )

    console.log("📡 Connecting to MCP OAuth library...")
    await client.connect(transport)
    console.log("✅ Connected successfully!")

    // Test listing tools
    console.log("\n🛠️  Listing available tools...")
    const tools = await client.listTools()
    console.log("Available tools:", tools.tools?.map(t => t.name))

    // Test calling github_me tool
    console.log("\n👤 Calling github_me tool...")
    const result = await client.callTool({
      name: "github_me",
      arguments: {}
    })

    if (result.content) {
      console.log("✅ GitHub profile retrieved:")
      result.content.forEach(item => {
        if (item.type === "text") {
          console.log(item.text)
        }
      })
    } else {
      console.log("❌ No content in response")
    }

    console.log("\n🎉 Test completed successfully!")
    
  } catch (error) {
    console.error("❌ Test failed:", error)
    process.exit(1)
  }
}

testMcpServer()

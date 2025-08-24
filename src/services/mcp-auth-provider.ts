import type { Response } from "express"
import type { OAuthServerProvider } from "@modelcontextprotocol/sdk/server/auth/provider.js"
import crypto from "node:crypto"

import {
  createClient,
  getByAccessToken,
  updateCodes,
  getByCode,
  getByClientId,
  getByRefreshToken,
  updateCredentials,
} from "../services/db.js"
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js"
import { McpOAuthConfig } from "../types/library.types.js"
import type { Connector } from "../types/connector.types.js"

// Utility functions for OAuth URL building
const getClientId = (config: McpOAuthConfig): string => {
  return config.clientId
}

const getScopes = (connector: Connector): string[] => {
  return connector.scopes ? [...connector.scopes] : []
}

const getUrlWithQueryParams = (baseUrl: string, params: Record<string, string>): string => {
  const url = new URL(baseUrl)
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value)
    }
  })
  return url.toString()
}

const getAuthCallbackUrl = (config: McpOAuthConfig): string => {
  return `${config.baseUrl}/authorized`
}

export const createMcpAuthProvider = (config: McpOAuthConfig): OAuthServerProvider => ({
  clientsStore: {
    getClient: async (client_id) => {
      console.log("getClient called with", { client_id })
      const client = getByClientId(client_id)
      if (!client) {
        throw new Error("Unauthorized: Invalid client ID")
      }

      return client.client as OAuthClientInformationFull
    },
    registerClient: async (client: OAuthClientInformationFull) => {
      console.log("registerClient called with", { client })
      createClient({ client })
      return client
    },
  },
  verifyAccessToken: async (token) => {
    console.log("verifyAccessToken called with", { token })
    const client = getByAccessToken(token)
    if (!client) {
      throw new Error("Unauthorized")
    }

    return {
      token: client.credentials?.access_token || "",
      clientId: client.client_id,
      scopes: ["openid", "email", "profile"],
      expiresAt: client.credentials!.access_token_expired_at,
    }
  },
  authorize: async (
    client: OAuthClientInformationFull,
    params: {
      codeChallenge: string
      redirectUri: string
      state: string
    },
    res: Response,
  ) => {
    console.log("authorize called with", { client, params })

    // Store the authorization request data for later use in the callback
    const code = crypto.randomBytes(32).toString("hex")
    if (params.codeChallenge) {
      updateCodes({
        client_id: client.client_id,
        code,
        code_challenge: params.codeChallenge,
      })
    }

    // Build OAuth authorization URL
    const clientId = getClientId(config)
    const scopes = getScopes(config.connector)
    const authorizeUrl = config.connector.authUrl

    if (!authorizeUrl) {
      throw new Error("OAuth authorization URL not configured for this connector")
    }

    // Build the callback URL that the OAuth provider will redirect to
    const callbackUrl = getAuthCallbackUrl(config)
    
    // Encode all necessary data in the state parameter as JSON
    const stateData = {
      originalState: params.state,
      code: code,
      clientId: client.client_id,
      redirectUri: params.redirectUri,
    }
    
    // Create the OAuth authorization URL with all required parameters
    const oauthAuthUrl = getUrlWithQueryParams(authorizeUrl, {
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      ...(config.connector.authInitUrlParams || {}),
      state: JSON.stringify(stateData),
    })

    console.log("oauthAuthUrl", oauthAuthUrl)

    // Redirect to the OAuth provider's authorization URL
    res.redirect(oauthAuthUrl)
  },
  challengeForAuthorizationCode: async (
    oauthClient: OAuthClientInformationFull,
    authorizationCode: string,
  ) => {
    console.log("challengeForAuthorizationCode called with", {
      oauthClient,
      authorizationCode,
    })
    const client = getByCode(oauthClient.client_id, authorizationCode)
    if (!client) {
      throw new Error("Unauthorized: Invalid authorization code")
    }
    return client.code_challenge || ""
  },
  exchangeAuthorizationCode: async (
    oauthClient: OAuthClientInformationFull,
    authorizationCode: string,
    codeVerifier?: string,
    redirectUri?: string,
  ) => {
    console.log("exchangeAuthorizationCode called with", {
      oauthClient,
      authorizationCode,
      codeVerifier,
      redirectUri,
    })

    const client = getByCode(oauthClient.client_id, authorizationCode)
    if (!client) {
      throw new Error("Unauthorized: Invalid authorization code")
    }

    // Note: User info is not required for OAuth token exchange

    const refreshToken = crypto.randomBytes(32).toString("hex")
    const accessToken = crypto.randomBytes(32).toString("hex")
    const accessTokenExpiredAt = Date.now() + (parseInt(process.env.TOKEN_EXPIRATION_TIME || "3600000", 10))

    const credentials = {
      access_token: accessToken,
      token_type: "Bearer" as const,
      access_token_expired_at: accessTokenExpiredAt,
      scope: "openid email profile",
      refresh_token: refreshToken,
    }

    updateCredentials({
      client_id: oauthClient.client_id,
      credentials,
    })

    return credentials
  },
  skipLocalPkceValidation: true,
  exchangeRefreshToken: async (
    oauthClient: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
  ) => {
    console.log("exchangeRefreshToken called with", {
      oauthClient,
      refreshToken,
      scopes,
    })
    const client = getByRefreshToken(refreshToken)
    if (!client) {
      throw new Error("Unauthorized: Invalid refresh token")
    }
    const accessToken = crypto.randomBytes(32).toString("hex")
    const accessTokenExpiredAt = Date.now() + (parseInt(process.env.TOKEN_EXPIRATION_TIME || "3600000", 10))
    updateCredentials({
      client_id: client.client_id,
      credentials: {
        ...client.credentials!,
        access_token: accessToken,
        access_token_expired_at: accessTokenExpiredAt,
      },
    })
    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: parseInt(process.env.TOKEN_EXPIRATION_TIME || "3600000", 10),
      scope: scopes?.join(" ") || "openid email profile",
      refresh_token: refreshToken,
    }
  },
})

/**
 * Type for JSONata string expressions that will be applied to objects
 * @template T The type of object that the JSONata string will be applied to
 */
export type JsonataString<T> = string | { __jsonataInput?: T }

export interface OAuthCredentials {
  access_token: string
  expires_at: string | null // ISO 8601 datetime
  refresh_token: string | null
  refresh_token_expires_at: string | null
  scope: string | null
  token_type: "Bearer"
}

/** OAuth provider's token response structure */
export interface OAuthTokenResponse {
  access_token: string
  expires_in?: number
  refresh_token?: string
  refresh_token_expires_in?: number
  scope?: string
  token_type?: string
  [key: string]: unknown // Allow other provider-specific fields
}

export interface Connector {
  authUrl?: string
  tokenUrl?: string
  refreshTokenUrl?: string // default to tokenUrl
  scopes?: string[] | readonly string[]
  codeExchangeConfig?: {
    modelCredentialsMapping?: JsonataString<OAuthCredentials> | ((config: OAuthTokenResponse) => OAuthCredentials)
    isForm?: boolean
    authorizationMapping?: JsonataString<string> | ((config: Record<string, unknown>) => string)
  }
  authInitUrlParams?: Record<string, string>
}

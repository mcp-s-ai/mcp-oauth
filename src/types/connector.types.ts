// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type JsonataString<T> = string // T = the type of the object that the jsonata string will be applied to

export interface OAuthCredentials {
  access_token: string
  expires_at: string | null // ISO 8601 datetime
  refresh_token: string | null
  refresh_token_expires_at: string | null
  scope: string | null
  token_type: "Bearer"
}

export interface Connector {
  authUrl?: string
  tokenUrl?: string
  refreshTokenUrl?: string // default to tokenUrl
  scopes?: string[] | readonly string[]
  codeExchangeConfig?: {
    modelCredentialsMapping?: JsonataString<OAuthCredentials> | ((config: any) => OAuthCredentials)
    isForm?: boolean
    authorizationMapping?: JsonataString<string> | ((config: any) => string)
  }
  authInitUrlParams?: Record<string, string>
}

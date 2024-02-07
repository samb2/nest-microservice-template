export interface JwtRefreshPayload {
  authId: string;
  iat?: number;
  exp?: number;
}

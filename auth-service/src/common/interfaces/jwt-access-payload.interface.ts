export interface JwtAccessPayload {
  authId: string;
  iat?: number;
  exp?: number;
}

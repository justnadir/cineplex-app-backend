export interface IRefreshToken {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  is_revoked: boolean;
  device_info: string | null;
  ip_address: string | null;
  jti: string;
  city: string | null;
  created_at: Date;
}

export type ICreateRefreshToken = Omit<
  IRefreshToken,
  "id" | "is_revoked" | "created_at"
>;

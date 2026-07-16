export interface RequestMeta {
  userAgent?: string | null;
  ip?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface IResetPassword {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ILoginInput {
  email: string;
  password: string;
  user_id: number;
  token_hash: string;
  device_info: string;
  ip_address: string;
  city: string;
}

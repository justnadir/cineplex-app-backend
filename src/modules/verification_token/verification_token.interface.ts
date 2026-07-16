import { OTP_PURPOSE } from "../../enums";

export interface IVerification_token {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  is_used: boolean;
  purpose: OTP_PURPOSE;
  created_at: Date;
}

export type ICreateVerification_token = Omit<
  IVerification_token,
  "id" | "is_used" | "created_at" | "expires_at"
>;

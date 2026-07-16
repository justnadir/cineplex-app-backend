import { OTP_PURPOSE } from "../../enums";

export interface IOtp {
  id: number;
  user_id: number | undefined;
  otp_hash: string;
  purpose: OTP_PURPOSE;
  attempts: number;
  max_attempts: number;
  expires_at: Date;
  is_used: boolean;
  created_at: Date;
}

export type ICreateOtp = Omit<
  IOtp,
  "id" | "attempts" | "max_attempts" | "expires_at" | "is_used" | "created_at"
>;

export interface IVerifyOtpInput {
  user_id: number;
  otp: string;
  purpose: OTP_PURPOSE;
}

export interface IResendOtp {
  email: string;
  purpose: OTP_PURPOSE;
}

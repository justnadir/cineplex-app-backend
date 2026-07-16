import { z } from "zod";

import { OTP_PURPOSE } from "../../enums";
import { emailSchema } from "../../validators";

export class AuthValidator {
  private passwordSchema = z
    .string()
    .trim()
    .min(6, { error: "Password must be at least 6 characters" })
    .max(12, { error: "Password must be at most 12 characters" });

  loginZodSchema = z.object({
    body: z.object({
      email: emailSchema,
      password: this.passwordSchema,
    }),
  });

  forgotPasswordZodSchema = z.object({
    body: z.object({
      email: emailSchema,
    }),
  });

  resetPasswordZodSchema = z.object({
    body: z.object({
      token: z
        .string({ error: "Token is required" })
        .min(1, { error: "Token is required" }),
      new_password: this.passwordSchema,
      confirm_password: this.passwordSchema,
    }),
  });

  verifyOtpZodSchema = z.object({
    body: z
      .object({
        email: emailSchema,
        otp: z.number(),
        purpose: z.nativeEnum(OTP_PURPOSE),
      })
      .strict(),
  });

  resendOtpZodSchema = z.object({
    body: z
      .object({
        email: emailSchema,
        purpose: z.nativeEnum(OTP_PURPOSE),
      })
      .strict(),
  });
}

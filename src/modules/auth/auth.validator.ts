import { z } from "zod";

import { OTP_PURPOSE } from "../../enums";
import { emailSchema, passwordZodValidator } from "../../validators";

export class AuthValidator {
  loginZodSchema = z.object({
    body: z.object({
      email: emailSchema,
      password: passwordZodValidator,
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
      new_password: passwordZodValidator,
      confirm_password: passwordZodValidator,
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

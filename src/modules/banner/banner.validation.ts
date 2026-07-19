import { z } from "zod";
import { idParamSchema } from "../../validators";
import { BANNER_STATUS } from "../../enums";

export class BannerValidator {
  private static bannerBody = z.object({
    title: z
      .string({ error: "Banner title is required" })
      .trim()
      .min(1, { error: "Banner title should not be empty" })
      .max(255, { error: "Banner title must be at most 255 characters" }),
    banner_image: z
      .string({ error: "Banner image is required" })
      .trim()
      .min(1, { error: "Banner image should not be empty" }),
  });

  createBannerZodSchema = z.object({
    body: BannerValidator.bannerBody.strict(),
  });

  updateBannerZodSchema = z.object({
    body: BannerValidator.bannerBody.partial().extend({
      status: z
        .enum(BANNER_STATUS, {
          error: "Status must be either draft or published",
        })
        .optional(),
    }),
  });

  bannerIdParamsSchema = z.object({
    params: idParamSchema,
  });
}

import { z } from "zod";
import { idParamSchema, paginationSchema } from "../../validators";
import { NEWS_STATUS } from "../../enums";

export class NewsValidator {
  private static newsBody = z.object({
    title: z.string({ error: "Title is required" }).trim().min(1).max(255),
    news_image: z.string({ error: "Image is required" }).trim().min(1),
    content: z.string({ error: "Content is required" }).trim().min(1),
    status: z.enum(NEWS_STATUS, {
      error: "Status must be either draft or published",
    }),
  });

  createNewsZodSchema = z.object({
    body: NewsValidator.newsBody.strict(),
  });

  updateNewsZodSchema = z.object({
    params: idParamSchema,
    body: NewsValidator.newsBody
      .partial()
      .extend({
        status: z
          .enum(NEWS_STATUS, {
            error: "Status must be either draft or published",
          })
          .optional(),
      })
      .strict(),
  });

  adminNewsQuerySchema = z.object({
    query: paginationSchema
      .extend({
        searchTerm: z.string().trim().optional(),
        sortBy: z
          .enum(["recent"], { error: "sortBy must be: recent" })
          .optional(),
        status: z
          .enum(NEWS_STATUS, {
            error: "Status must be either draft or published",
          })
          .optional(),
      })
      .strict(),
  });

  publicNewsQuerySchema = z.object({
    query: paginationSchema
      .extend({
        searchTerm: z.string().trim().optional(),
        sortBy: z
          .enum(["recent"], { error: "sortBy must be: recent" })
          .optional(),
      })
      .strict(),
  });
}

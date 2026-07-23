import { z } from "zod";
import { idParamSchema, paginationSchema } from "../../validators";
import { COMMENT_STATUS } from "../../enums";

export class CommentValidator {
  public static commentBoday = z.object({
    news_id: z.coerce
      .number({ error: "News id is required" })
      .int()
      .positive({ error: "News id must be a positive number" }),
    nick_name: z
      .string({ error: "Nick name is required" })
      .trim()
      .min(2, { error: "Nick name must be at least 2 characters" })
      .max(100, { error: "Nick name must be at most 100 characters" }),
    email: z
      .string({ error: "Email is required" })
      .email({ error: "Email must be a valid email address" })
      .trim(),
    status: z.enum(COMMENT_STATUS, {
      error: `Status must be one of: ${Object.values(COMMENT_STATUS).join(", ")}`,
    }),

    content: z
      .string({ error: "Content is required" })
      .trim()
      .min(1, { error: "Content should not be empty" })
      .max(500, { error: "Content must be at most 500 characters" }),
  });

  createCommentZodSchema = z.object({
    body: CommentValidator.commentBoday,
  });

  moderateCommentZodSchema = z.object({
    params: idParamSchema,
    body: z.object({
      status: z.enum(["approved", "rejected", "pending"], {
        error: "status must be either approved or rejected",
      }),
    }),
  });

  listPublicCommentParamsSchema = z.object({
    params: idParamSchema,
    query: paginationSchema.strict(),
  });

  listAdminCommentQuerySchema = z.object({
    params: idParamSchema,
    query: paginationSchema
      .partial()
      .extend({
        status: z.enum(COMMENT_STATUS, {
          error: `Status must be one of: ${Object.values(COMMENT_STATUS).join(", ")}`,
        }),
      })
      .strict(),
  });
}

import { z } from "zod";
import { idParamSchema, paginationSchema } from "../../validators";
import { THEATER_STATUS } from "../../enums";

export class TheaterValidator {
  private static theaterBody = z.object({
    name: z.string({ error: "Name is required" }).trim().min(2).max(150),
    code: z
      .string({ error: "Code is required" })
      .trim()
      .min(2, { error: "Code must be at least 2 characters" })
      .max(20, { error: "Code must be at most 20 characters" }),
    location: z
      .string({ error: "Location is required" })
      .trim()
      .min(2)
      .max(255),
  });

  createTheaterZodSchema = z.object({
    body: TheaterValidator.theaterBody,
  });

  theaterIdParamsSchema = z.object({
    params: idParamSchema,
  });

  updateTheaterZodSchema = z.object({
    params: idParamSchema,
    body: TheaterValidator.theaterBody.partial().extend({
      status: z.enum(THEATER_STATUS).optional(),
    }),
  });

  // public theaters query = pagination only.
  theatersQuerySchema = z.object({
    query: paginationSchema.strict(),
  });

  // admin theaters query = pagination + is_active filter.
  adminTheatersQuerySchema = z.object({
    query: paginationSchema
      .extend({
        status: z.enum(THEATER_STATUS, {
          error: `Status must be one of: ${Object.values(THEATER_STATUS).join(", ")}`,
        }),
      })
      .strict(),
  });
}

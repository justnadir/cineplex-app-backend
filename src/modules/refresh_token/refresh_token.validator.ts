import { z } from "zod";
import { positiveIntIdSchema, idParamSchema } from "../../validators";

export class RefreshTokenValidator {
  revokZodSchema = z.object({
    params: idParamSchema,
    body: z
      .object({
        user_id: positiveIntIdSchema("User ID"),
      })
      .strict(),
  });
}

import { z } from "zod";

export const idParamSchema = z.object({
  id: z.coerce
    .number({ error: "ID must be a number" })
    .int({ error: `ID must be an integer` })
    .positive({ error: `ID must be a positive number` }),
});

// this validator works for any route that has a positive integer id in the params, e.g., /news/:id, /theater/:id, etc.
export const validIdParamCheckSchema = z.object({
  params: z.coerce.number().int().positive(),
});

// this validator works for any table which will be received any fereign key id in the params, e.g., /theater/:id/movie/:id, /news/:id/comment/:id, etc.
export const positiveIntIdSchema = (fieldName: string) =>
  z.coerce
    .number({
      error: (issue) => {
        if (issue.input === undefined) return `${fieldName} is required`;
        if (issue.code === "invalid_type")
          return `${fieldName} must be a number`;
        return `Invalid ${fieldName}`;
      },
    })
    .int({ error: `${fieldName} must be an integer` })
    .positive({ error: `${fieldName} must be a positive number` });

// this validator works for any route that has pagination query params, e.g., /news?page=1&limit=10, /theater?page=2&limit=5, etc.
export const paginationSchema = z.object({
  page: z.coerce
    .number({ error: "Page must be a number" })
    .int({ error: "Page must be an integer" })
    .min(1, { error: "Page must be at least 1" })
    .optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number" })
    .int({ error: "Limit must be an integer" })
    .min(1, { error: "Limit must be at least 1" })
    .max(100, { error: "Limit must be at most 100" })
    .optional(),
});

// check valid email or not.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email format")
  .max(254);

// valid phone number with optional leading + and 11 digits.
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{11}$/, "Phone must be 11 digits, optional leading +");

export const urlSchema = z.string().trim().url("Invalid URL").max(2048);

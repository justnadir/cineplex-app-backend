import { z } from "zod";
import { idParamSchema, paginationSchema } from "../../validators";
import { MOVIE_CATEGORY, MOVIE_STATUS } from "../../enums";

export class MovieValidator {
  private static movieBody = z.object({
    movie_poster: z
      .string({ error: "Movie poster is required" })
      .trim()
      .min(1, { error: "Movie poster should not be empty" }),
    title: z
      .string({ error: "Movie title is required" })
      .trim()
      .min(1, { error: "Movie title should not be empty" })
      .max(255, { error: "Movie title must be at most 255 characters" }),
    category: z.enum(MOVIE_CATEGORY, {
      error: `Category must be one of: ${Object.values(MOVIE_CATEGORY).join(", ")}`,
    }),
    actor: z
      .string({ error: "Actor is required" })
      .trim()
      .min(1, { error: "Actor should not be empty" }),

    genre: z
      .string({ error: "Genre is required" })
      .trim()
      .min(1, { error: "Genre should not be empty" })
      .max(50, { error: "Genre must be at most 50 characters" }),

    release_date: z.coerce.date({ error: "A valid release date is required" }),

    duration: z
      .string({ error: "Duration is required" })
      .trim()
      .min(1, { error: "Duration should not be empty" })
      .max(20, { error: "Duration must be at most 20 characters" }),

    language: z
      .string({ error: "Language is required" })
      .trim()
      .min(1, { error: "Language should not be empty" })
      .max(50, { error: "Language must be at most 50 characters" }),

    synopsis: z
      .string({ error: "Synopsis is required" })
      .trim()
      .min(1, { error: "Synopsis should not be empty" }),
    trailer: z
      .string({ error: "Trailer is required" })
      .trim()
      .min(1, { error: "Trailer should not be empty" })
      .url({ error: "Trailer must be a valid URL" })
      .max(255, { error: "Trailer URL must be at most 255 characters" }),
  });

  createMovieValidatorSchema = z.object({
    body: MovieValidator.movieBody.strict(),
  });

  updateMovieValidatorSchema = z.object({
    params: idParamSchema,
    body: MovieValidator.movieBody
      .partial()
      .extend({
        status: z
          .enum(MOVIE_STATUS, {
            error: `Movie status must be one of: ${Object.values(MOVIE_STATUS).join(", ")}`,
          })
          .optional(),
      })
      .strict(),
  });

  listMovieQueryValidatorSchema = z.object({
    query: paginationSchema.strict(),
  });
}

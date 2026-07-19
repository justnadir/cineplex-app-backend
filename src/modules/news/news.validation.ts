import { z } from "zod";
import { idParamSchema, paginationSchema } from "../../validators";
const STATUSES = ["draft", "published"] as const;

const newsBody = z.object({
    title: z.string({ error: "Title is required" }).trim().min(1).max(255),
    news_image: z.string({ error: "Image is required" }).trim().min(1),
    content: z.string({ error: "Content is required" }).trim().min(1),
});

// Create news schema
export const createNewsZodSchema = z.object({
    body: newsBody,
});

// Validates the query parameters for specific news retrieval (public)
export const publicNewsQuerySchema = z.object({
    query: paginationSchema
        .extend({
            searchTerm: z.string().trim().optional(),
            sortBy: z
                .enum(["recent"], { error: "sortBy must be: recent" })
                .optional(),
        })
        .strict(),
});

// Validates the query parameters for specific news retrieval (admin)
export const adminNewsQuerySchema = z.object({
    query: paginationSchema
        .extend({
            searchTerm: z.string().trim().optional(),
            sortBy: z
                .enum(["recent"], { error: "sortBy must be: recent" })
                .optional(),
            status: z
                .enum(STATUSES, { error: "Status must be either draft or published" })
                .optional(),
        })
        .strict(),
});

// Validates the request body for updating news (all fields optional)
export const updateNewsZodSchema = z.object({
    params: idParamSchema,
    body: newsBody
        .partial()
        .extend({
            status: z
                .enum(STATUSES, { error: "Status must be either draft or published" })
                .optional(),
        })
        .strict(),
});

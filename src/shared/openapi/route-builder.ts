import { Router, RequestHandler } from "express";
import { ZodObject, ZodTypeAny } from "zod";
import { registry } from "./registry";
import validateRequest from "../../middlewares/request-validator.middleware";

type Method = "get" | "post" | "patch" | "put" | "delete";

interface RouteConfig {
  method: Method;
  path: string;
  tags?: string[];
  summary?: string;
  description?: string;
  schema?: ZodObject;
  responseSchema?: ZodTypeAny;
  auth?: boolean;
  middlewares?: RequestHandler[];
  handler: RequestHandler;
}

const toOpenApiPath = (expressPath: string): string =>
  expressPath.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");

export const defineRoute = (
  router: Router,
  config: RouteConfig,
  basePath = ""
) => {
  const {
    method,
    path,
    schema,
    middlewares = [],
    handler,
    tags,
    summary,
    description,
    responseSchema,
    auth,
  } = config;

  const chain: RequestHandler[] = [...middlewares];
  if (schema) chain.push(validateRequest(schema));
  chain.push(handler);
  router[method](path, ...chain);

  registry.registerPath({
    method,
    path: toOpenApiPath(basePath + path),
    tags,
    summary,
    description,
    security: auth ? [{ bearerAuth: [] }] : undefined,
    request: schema?.shape?.body
      ? {
          body: {
            content: { "application/json": { schema: schema.shape.body } },
          },
        }
      : undefined,
    responses: {
      200: {
        description: "Success",
        content: responseSchema
          ? { "application/json": { schema: responseSchema } }
          : undefined,
      },
    },
  });
};

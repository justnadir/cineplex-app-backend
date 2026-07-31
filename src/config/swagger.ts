import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "../shared/openapi/registry";

const API_DESCRIPTION = `

Official REST API for the Cineplex platform — powers movie ticketing, news, comments, and user management.

## 🔑 Authentication
- All protected routes require a **JWT Bearer token** in the header:
  \`Authorization: Bearer <token>\`

- Obtain a token via the login endpoint. Tokens expire — use the refresh endpoint before expiry to avoid \`401 Unauthorized\`.

- Public endpoints (no auth needed) are explicitly marked in their route description.

## 👤 Roles & Permissions
- **SUPER_ADMIN** — full access to all admin operations.

- **ADMIN** — access to most content-management operations (create/moderate comments, manage news, etc.).

- **USER / Public** — read-only access to public endpoints only.

- If a route requires specific roles, it will be documented under that route's description. Calling a route without the correct role returns \`403 Forbidden\`.

## 🚦 Rate Limiting
- Write operations (POST/PATCH/DELETE) are rate-limited (\`writeLimiter\`) to prevent abuse.

- Exceeding the limit returns \`429 Too Many Requests\`. Check the \`Retry-After\` header before retrying.

## ⚠️ Error Response Format
All errors follow a consistent shape:
\`\`\`json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [ /* optional field-level validation errors */ ]
}
\`\`\`
Common status codes: \`400\` (validation error), \`401\` (unauthenticated), \`403\` (unauthorized), \`404\` (not found), \`409\` (conflict), \`429\` (rate limited), \`500\` (server error).

## ✅ Success Response Format
\`\`\`json
{
  "success": true,
  "message": "Description of what happened",
  "data": { /* payload */ }
}
\`\`\`

## 📄 Pagination
List endpoints accept \`page\` and \`limit\` query params and return pagination meta:
\`\`\`json
{
  "data": [ /* items */ ],
  "meta": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 }
}
\`\`\`

## 🔢 Versioning
- Current version: **v1**, base path \`/api/v1\`.
- Breaking changes will be released under a new version path (e.g. \`/api/v2\`); v1 will keep working until deprecation is announced.

## 🧪 Validation
- All request bodies/params/queries are validated using **Zod schemas**. Invalid input returns \`400\` with detailed field errors — check the \`errors\` array in the response.

## 📞 Support
Questions or issues? Contact **engineering@cineplex.com** or check the full docs at **https://docs.cineplex.com**.
`;

export const generateOpenApiSpec = () => {
  registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description:
      "Enter the JWT token obtained from the login endpoint. Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`",
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Cineplex Web Backend API",
      version: "1.0.0",
      description: API_DESCRIPTION,
      contact: {
        name: "Cineplex Engineering Team",
        email: "engineering@cineplex.com",
        url: "https://cineplex.com",
      },
    },
    servers: [{ url: "/api/v1", description: "Current environment" }],
  });
};

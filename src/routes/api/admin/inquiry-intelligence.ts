import { createFileRoute } from "@tanstack/react-router";
import { z, ZodError } from "zod";

import { isAdminAuthorized, regenerateInquiryIntelligence } from "@/lib/settleside.server";

const requestSchema = z.object({
  id: z.string().trim().min(3).max(120),
});

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/admin/inquiry-intelligence")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAdminAuthorized(request)) {
          return jsonError("Missing or invalid admin token.", 401);
        }

        try {
          const body = await request.json();
          const { id } = requestSchema.parse(body);
          const result = await regenerateInquiryIntelligence(id);

          if (!result.ok) {
            if (result.error === "not-found") {
              return jsonError(`Inquiry "${id}" was not found.`, 404);
            }

            return jsonError(
              "The AI assistant is unavailable or not configured on this server.",
              503,
            );
          }

          return Response.json({ inquiry: result.inquiry });
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError(error.issues[0]?.message ?? "Invalid request payload.");
          }

          console.error(error);
          return jsonError("Unable to regenerate inquiry intelligence right now.", 500);
        }
      },
    },
  },
});

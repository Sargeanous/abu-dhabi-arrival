import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

import { parseMoveIntake } from "@/lib/settleside.ai";
import { moveIntakeRequestSchema } from "@/lib/settleside.schemas";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/intake")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { description } = moveIntakeRequestSchema.parse(body);
          const result = await parseMoveIntake(description);

          if (!result.ok) {
            const status =
              result.reason === "not-configured"
                ? 503
                : result.reason === "unavailable"
                  ? 502
                  : 422;
            return Response.json(result, { status });
          }

          return Response.json(result);
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError(error.issues[0]?.message ?? "Invalid intake payload.");
          }

          console.error(error);
          return jsonError("Unable to parse the move description right now.", 500);
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

import { parseMoveIntake } from "@/lib/settleside.ai";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/settleside.ratelimit";
import { moveIntakeRequestSchema } from "@/lib/settleside.schemas";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/intake")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = clientIp(request);
        const minute = rateLimit({ key: `intake-min:${ip}`, max: 5, windowMs: 60_000 });
        const hour = rateLimit({ key: `intake-hour:${ip}`, max: 20, windowMs: 3_600_000 });

        if (!minute.allowed || !hour.allowed) {
          return tooManyRequests(
            "Too many requests. Please wait a moment and try again.",
            Math.max(minute.retryAfterSeconds, hour.retryAfterSeconds),
          );
        }

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

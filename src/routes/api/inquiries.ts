import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

import { clientIp, rateLimit, tooManyRequests } from "@/lib/settleside.ratelimit";
import { createInquiry, isAdminAuthorized, listInquiries } from "@/lib/settleside.server";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/inquiries")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = clientIp(request);
        const minute = rateLimit({ key: `inquiry-min:${ip}`, max: 3, windowMs: 60_000 });
        const hour = rateLimit({ key: `inquiry-hour:${ip}`, max: 10, windowMs: 3_600_000 });

        if (!minute.allowed || !hour.allowed) {
          return tooManyRequests(
            "Too many submissions. Please wait a moment and try again.",
            Math.max(minute.retryAfterSeconds, hour.retryAfterSeconds),
          );
        }

        try {
          const body = await request.json();
          const result = await createInquiry(body);
          return Response.json(result, { status: 201 });
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError(error.issues[0]?.message ?? "Invalid inquiry payload.");
          }

          console.error(error);
          return jsonError("Unable to save inquiry right now.", 500);
        }
      },
      GET: async ({ request }) => {
        if (!(await isAdminAuthorized(request))) {
          return jsonError("Missing or invalid admin token.", 401);
        }

        const inquiries = await listInquiries();
        return Response.json({ inquiries });
      },
    },
  },
});

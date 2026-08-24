import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

import { moveDeskRequestSchema } from "@/lib/settleside.schemas";
import { isAdminAuthorized, runMoveDeskAction } from "@/lib/settleside.server";

const ERROR_MESSAGES: Record<string, [string, number]> = {
  "not-found": ["That inquiry was not found.", 404],
  "no-categories": ["This inquiry has no service categories to quote.", 400],
  "no-quotes": ["Paste the provider quotes first.", 400],
  "no-briefs": ["Draft the provider briefs first.", 400],
  "no-recipients": [
    "No published provider with an email address matched these categories. Publish a provider and add its email, then try again.",
    400,
  ],
  "no-recommendation": ["Draft the reply before sending it.", 400],
  "mail-not-configured": [
    "Customer email needs a verified sending domain: set SETTLESIDE_NOTIFY_FROM to an address on a domain verified in Resend.",
    503,
  ],
  "ai-unavailable": ["The AI assistant is unavailable or not configured on this server.", 503],
};

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/admin/move-desk")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAdminAuthorized(request))) {
          return jsonError("Missing or invalid admin token.", 401);
        }

        try {
          const body = await request.json();
          const parsed = moveDeskRequestSchema.parse(body);
          const result = await runMoveDeskAction(parsed);

          if (!result.ok) {
            const [message, status] = ERROR_MESSAGES[result.error] ?? ["Request failed.", 400];
            return jsonError(message, status);
          }

          return Response.json({ inquiry: result.inquiry });
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError(error.issues[0]?.message ?? "Invalid request payload.");
          }

          console.error(error);
          return jsonError("Unable to run that move desk action right now.", 500);
        }
      },
    },
  },
});

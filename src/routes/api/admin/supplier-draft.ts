import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

import { isAiConfigured, parseSupplierIntake } from "@/lib/settleside.ai";
import { supplierIntakeRequestSchema } from "@/lib/settleside.schemas";
import { isAdminAuthorized } from "@/lib/settleside.server";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/admin/supplier-draft")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAdminAuthorized(request))) {
          return jsonError("Missing or invalid admin token.", 401);
        }

        if (!isAiConfigured()) {
          return jsonError("The AI assistant is not configured on this server.", 503);
        }

        try {
          const body = await request.json();
          const { text } = supplierIntakeRequestSchema.parse(body);
          const draft = await parseSupplierIntake(text);

          if (!draft) {
            return jsonError(
              "Couldn't turn that into a supplier draft. Try rephrasing, or add it manually.",
              502,
            );
          }

          return Response.json({ draft });
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError(error.issues[0]?.message ?? "Invalid request payload.");
          }

          console.error(error);
          return jsonError("Unable to draft the supplier right now.", 500);
        }
      },
    },
  },
});

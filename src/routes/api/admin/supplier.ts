import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

import { isAdminAuthorized, saveSupplier } from "@/lib/settleside.server";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/admin/supplier")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAdminAuthorized(request))) {
          return jsonError("Missing or invalid admin token.", 401);
        }

        try {
          const result = await saveSupplier(await request.json());
          return Response.json(result, { status: 201 });
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError(error.issues[0]?.message ?? "Invalid supplier payload.");
          }

          const message = error instanceof Error ? error.message : "Unable to save supplier.";
          return jsonError(message, 400);
        }
      },
    },
  },
});

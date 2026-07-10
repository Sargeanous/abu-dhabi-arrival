import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

import {
  getAdminCatalogSnapshot,
  isAdminAuthorized,
  upsertProvider,
} from "@/lib/settleside.server";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/admin/providers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAdminAuthorized(request))) {
          return jsonError("Missing or invalid admin token.", 401);
        }

        const snapshot = await getAdminCatalogSnapshot();
        return Response.json({ providers: snapshot.providers });
      },
      POST: async ({ request }) => {
        if (!(await isAdminAuthorized(request))) {
          return jsonError("Missing or invalid admin token.", 401);
        }

        try {
          const provider = await upsertProvider(await request.json());
          return Response.json({ provider }, { status: 201 });
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError(error.issues[0]?.message ?? "Invalid provider payload.");
          }

          console.error(error);
          return jsonError("Unable to save provider.", 500);
        }
      },
    },
  },
});

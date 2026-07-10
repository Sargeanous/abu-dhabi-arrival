import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

import {
  getAdminCatalogSnapshot,
  isAdminAuthorized,
  upsertCatalogItem,
} from "@/lib/settleside.server";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/admin/catalog")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAdminAuthorized(request)) {
          return jsonError("Missing or invalid admin token.", 401);
        }

        const snapshot = await getAdminCatalogSnapshot();
        return Response.json({ catalogItems: snapshot.catalogItems });
      },
      POST: async ({ request }) => {
        if (!isAdminAuthorized(request)) {
          return jsonError("Missing or invalid admin token.", 401);
        }

        try {
          const item = await upsertCatalogItem(await request.json());
          return Response.json({ item }, { status: 201 });
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError(error.issues[0]?.message ?? "Invalid catalog item payload.");
          }

          const message = error instanceof Error ? error.message : "Unable to save catalog item.";
          return jsonError(message, 400);
        }
      },
    },
  },
});

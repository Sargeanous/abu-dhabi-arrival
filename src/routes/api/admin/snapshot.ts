import { createFileRoute } from "@tanstack/react-router";

import { getAdminCatalogSnapshot, isAdminAuthorized } from "@/lib/settleside.server";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/admin/snapshot")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAdminAuthorized(request)) {
          return jsonError("Missing or invalid admin token.", 401);
        }

        return Response.json(await getAdminCatalogSnapshot());
      },
    },
  },
});

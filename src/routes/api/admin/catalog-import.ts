import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

import { importCatalogCsv, isAdminAuthorized } from "@/lib/settleside.server";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/admin/catalog-import")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAdminAuthorized(request))) {
          return jsonError("Missing or invalid admin token.", 401);
        }

        try {
          const result = await importCatalogCsv(await request.json());
          return Response.json(result, { status: 201 });
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError(error.issues[0]?.message ?? "Invalid CSV import payload.");
          }

          console.error(error);
          return jsonError("Unable to import catalog CSV.", 500);
        }
      },
    },
  },
});

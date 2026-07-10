import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

import { catalogCsvMapRequestSchema } from "@/lib/settleside.schemas";
import { isAdminAuthorized, mapCatalogCsv } from "@/lib/settleside.server";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/admin/catalog-map")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await isAdminAuthorized(request))) {
          return jsonError("Missing or invalid admin token.", 401);
        }

        try {
          const body = await request.json();
          const { csv } = catalogCsvMapRequestSchema.parse(body);
          const result = await mapCatalogCsv(csv);

          if (!result.ok) {
            if (result.error === "empty-csv") {
              return jsonError("The CSV needs a header row and at least one data row.");
            }

            return jsonError(
              "The AI assistant is unavailable or not configured on this server.",
              503,
            );
          }

          return Response.json({
            csv: result.csv,
            notes: result.notes,
            rows: result.rows,
            mappedFields: result.mappedFields,
          });
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError(error.issues[0]?.message ?? "Invalid request payload.");
          }

          console.error(error);
          return jsonError("Unable to map the CSV right now.", 500);
        }
      },
    },
  },
});

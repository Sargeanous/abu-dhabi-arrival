import { createFileRoute } from "@tanstack/react-router";

import { getMarketplaceSnapshot } from "@/lib/settleside.server";

export const Route = createFileRoute("/api/catalog")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const snapshot = await getMarketplaceSnapshot({
          destination: url.searchParams.get("destination") ?? "Abu Dhabi",
          category: url.searchParams.get("category") ?? undefined,
        });

        return Response.json({
          destination: snapshot.destination,
          lastSyncedAt: snapshot.lastSyncedAt,
          products: snapshot.products,
        });
      },
    },
  },
});

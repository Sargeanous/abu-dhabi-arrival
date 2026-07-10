import { createFileRoute } from "@tanstack/react-router";

import { storageMode } from "@/lib/settleside.storage";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          ok: true,
          app: "SettleSide",
          backend: "tanstack-start",
          storage: storageMode(),
          timestamp: new Date().toISOString(),
        }),
    },
  },
});

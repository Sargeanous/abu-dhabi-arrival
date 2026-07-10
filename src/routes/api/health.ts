import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          ok: true,
          app: "SettleSide",
          backend: "tanstack-start",
          storage: process.env.SETTLESIDE_DATA_DIR ? "configured-json" : "local-json",
          timestamp: new Date().toISOString(),
        }),
    },
  },
});

import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders } from "@tanstack/react-start/server";

import { parseMoveIntake } from "./settleside.ai";
import { clientIp, rateLimit } from "./settleside.ratelimit";
import {
  inquirySchema,
  marketplaceQuerySchema,
  moveIntakeRequestSchema,
} from "./settleside.schemas";
import { createInquiry, getMarketplaceSnapshot } from "./settleside.server";

// Shares buckets with the /api routes so the form and the public API draw
// from the same per-IP allowance.
function enforceLimit(prefix: string, max: number, windowMs: number) {
  const request = getRequest();
  const ip = request ? clientIp(request) : "local";
  const result = rateLimit({ key: `${prefix}:${ip}`, max, windowMs });

  if (!result.allowed) {
    throw new Error("Too many requests. Please wait a moment and try again.");
  }
}

export const loadMarketplaceSnapshot = createServerFn({ method: "GET" })
  .validator((data: unknown) => marketplaceQuerySchema.parse(data ?? {}))
  .handler(async ({ data }) => {
    setResponseHeaders({
      "Cache-Control": "public, max-age=60",
    });

    return getMarketplaceSnapshot(data);
  });

export const submitInquiry = createServerFn({ method: "POST" })
  .validator(inquirySchema)
  .handler(async ({ data }) => {
    enforceLimit("inquiry-min", 3, 60_000);
    enforceLimit("inquiry-hour", 10, 3_600_000);
    return createInquiry(data);
  });

export const parseMoveIntakeDraft = createServerFn({ method: "POST" })
  .validator((data: unknown) => moveIntakeRequestSchema.parse(data))
  .handler(async ({ data }) => {
    enforceLimit("intake-min", 5, 60_000);
    enforceLimit("intake-hour", 20, 3_600_000);
    return parseMoveIntake(data.description);
  });

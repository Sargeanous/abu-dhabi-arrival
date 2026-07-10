import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { parseMoveIntake } from "./settleside.ai";
import {
  inquirySchema,
  marketplaceQuerySchema,
  moveIntakeRequestSchema,
} from "./settleside.schemas";
import { createInquiry, getMarketplaceSnapshot } from "./settleside.server";

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
  .handler(async ({ data }) => createInquiry(data));

export const parseMoveIntakeDraft = createServerFn({ method: "POST" })
  .validator((data: unknown) => moveIntakeRequestSchema.parse(data))
  .handler(async ({ data }) => parseMoveIntake(data.description));

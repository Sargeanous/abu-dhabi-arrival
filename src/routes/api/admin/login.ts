import { createFileRoute } from "@tanstack/react-router";
import { z, ZodError } from "zod";

import { adminSignIn } from "@/lib/settleside.auth";
import { isSupabaseConfigured } from "@/lib/settleside.storage";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/admin/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isSupabaseConfigured()) {
          return jsonError("Admin login requires Supabase to be configured.", 503);
        }

        try {
          const body = await request.json();
          const { email, password } = loginSchema.parse(body);
          const session = await adminSignIn(email, password);

          if (!session) {
            return jsonError("Invalid email or password.", 401);
          }

          return Response.json({ session });
        } catch (error) {
          if (error instanceof ZodError) {
            return jsonError("Enter a valid email and password.");
          }

          console.error(error);
          return jsonError("Unable to sign in right now.", 500);
        }
      },
    },
  },
});

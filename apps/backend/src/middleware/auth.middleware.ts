import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { auth } from "../../auth";

declare module "hono" {
  interface ContextVariableMap {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session & {
      activeVenueId: string;
    };
  }
}

export const protect = createMiddleware(async (c, next) => {
  const response = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!response) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }

  const isSuperadmin = response.user.role === "superadmin";

  if (!(response.session.activeVenueId || isSuperadmin)) {
    throw new HTTPException(403, {
      message: "No active venue.",
    });
  }

  c.set("user", response.user);
  c.set("session", {
    ...response.session,
    activeVenueId: response.session.activeVenueId,
  });

  await next();
});

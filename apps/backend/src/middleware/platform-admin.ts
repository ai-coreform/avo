import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { auth } from "../../auth";

export const requirePlatformAdmin = createMiddleware(async (c, next) => {
  const response = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!response) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }

  if (response.user.role !== "superadmin") {
    throw new HTTPException(403, {
      message: "Forbidden. Platform admin access required.",
    });
  }

  c.set("user", response.user);
  c.set("session", {
    ...response.session,
    activeVenueId: response.session.activeVenueId,
  });

  await next();
});

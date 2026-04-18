import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, bearer, organization } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import database from "@/db";
import schema from "@/db/schema";
import { member as memberTable } from "@/db/schema/auth/member";
import { user as userTable } from "@/db/schema/auth/user";
import { getAllowedOrigins } from "@/utils/allowed-origins";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
const emailFrom = process.env.RESEND_FROM_EMAIL ?? "Avo <noreply@avo.app>";

const adminAcControl = createAccessControl({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
} as const);

const superadminRole = adminAcControl.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
});

const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.BASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;
const crossSubDomainCookieDomain = process.env.BETTER_AUTH_COOKIE_DOMAIN;
const cookiePrefix = process.env.BETTER_AUTH_COOKIE_PREFIX;

export const auth = betterAuth({
  baseURL: baseUrl,
  secret,
  basePath: "/api/auth",
  plugins: [
    bearer(),
    admin({
      ac: adminAcControl,
      roles: {
        superadmin: superadminRole,
      },
      adminRoles: ["superadmin"],
      defaultRole: "admin",
    }),
    organization({
      allowUserToCreateOrganization: true,
      roles: {
        owner: ownerAc,
        admin: adminAc,
        member: memberAc,
      },
      async sendInvitationEmail(data) {
        if (!resend) {
          console.warn(
            "[auth] RESEND_API_KEY not set, skipping invitation email to:",
            data.email
          );
          return;
        }

        const inviteLink = `${frontendUrl}/inviti?id=${data.id}`;
        const inviterName = data.inviter.user.name ?? "Un membro";
        const venueName = data.organization.name;

        await resend.emails.send({
          from: emailFrom,
          to: data.email,
          subject: `${inviterName} ti ha invitato su ${venueName}`,
          html: [
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head>',
            "<body style=\"margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5\">",
            '<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">',
            '<tr><td align="center">',
            '<table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden">',
            '<tr><td style="padding:32px 32px 24px;text-align:center">',
            `<h1 style="margin:0 0 8px;font-size:20px;color:#18181b">Sei stato invitato!</h1>`,
            `<p style="margin:0;font-size:15px;color:#52525b;line-height:1.5">`,
            `<strong>${inviterName}</strong> ti ha invitato a collaborare su <strong>${venueName}</strong> tramite Avo.</p>`,
            "</td></tr>",
            '<tr><td style="padding:0 32px 24px;text-align:center">',
            `<a href="${inviteLink}" style="display:inline-block;padding:12px 32px;background:#18181b;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px">Accetta invito</a>`,
            "</td></tr>",
            '<tr><td style="padding:0 32px 32px;text-align:center">',
            '<p style="margin:0;font-size:13px;color:#a1a1aa">Questo invito scade tra 48 ore.</p>',
            "</td></tr>",
            "</table>",
            "</td></tr></table>",
            "</body></html>",
          ].join(""),
        });
      },
      organizationHooks: {
        async afterRemoveMember({ member }) {
          // If the removed user has no remaining memberships, delete the user entirely
          try {
            const remaining = await database
              .select({ id: memberTable.id })
              .from(memberTable)
              .where(eq(memberTable.userId, member.userId))
              .limit(1);

            console.log(
              "[auth] afterRemoveMember hook fired",
              JSON.stringify({
                memberId: member.id,
                userId: member.userId,
                remainingMemberships: remaining.length,
              })
            );

            if (remaining.length === 0) {
              await database
                .delete(userTable)
                .where(eq(userTable.id, member.userId));
              console.log(
                "[auth] Deleted user with no remaining memberships:",
                member.userId
              );
            }
          } catch (error) {
            console.error("[auth] afterRemoveMember error:", error);
          }
        },
      },
      schema: {
        organization: {
          modelName: "venue",
        },
        member: {
          fields: {
            organizationId: "venueId",
          },
        },
        session: {
          fields: {
            activeOrganizationId: "activeVenueId",
          },
        },
        organizationRole: {
          fields: {
            organizationId: "venueId",
          },
        },
        invitation: {
          fields: {
            organizationId: "venueId",
          },
        },
      },
    }),
  ],
  database: drizzleAdapter(database, {
    provider: "pg",
    schema,
  }),
  databaseHooks: {
    session: {
      create: {
        async before(session) {
          const [membership] = await database
            .select({ venueId: memberTable.venueId })
            .from(memberTable)
            .where(eq(memberTable.userId, session.userId))
            .limit(1);

          if (membership?.venueId) {
            return {
              data: {
                ...session,
                activeVenueId: membership.venueId,
              },
            };
          }
          return { data: session };
        },
      },
    },
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
    ...(cookiePrefix ? { cookiePrefix } : {}),
    ...(crossSubDomainCookieDomain
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: crossSubDomainCookieDomain,
          },
        }
      : {}),
  },
  emailAndPassword: {
    enabled: true,
    async sendResetPassword(data) {
      if (!resend) {
        console.warn(
          "[auth] RESEND_API_KEY not set, skipping reset-password email to:",
          data.user.email
        );
        return;
      }

      // better-auth calls this with a URL that points to its own API endpoint
      // (/api/auth/reset-password?token=...). Redirect users through our own
      // /reimposta-password page instead, which then calls the auth client.
      const urlObj = new URL(data.url);
      const token = urlObj.searchParams.get("token") ?? "";
      const resetLink = `${frontendUrl}/reimposta-password?token=${encodeURIComponent(token)}`;

      await resend.emails.send({
        from: emailFrom,
        to: data.user.email,
        subject: "Reimposta la tua password Avo",
        html: [
          '<!DOCTYPE html><html><head><meta charset="utf-8"></head>',
          "<body style=\"margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5\">",
          '<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">',
          '<tr><td align="center">',
          '<table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden">',
          '<tr><td style="padding:32px 32px 24px;text-align:center">',
          '<h1 style="margin:0 0 8px;font-size:20px;color:#18181b">Reimposta la tua password</h1>',
          '<p style="margin:0;font-size:15px;color:#52525b;line-height:1.5">',
          "Abbiamo ricevuto una richiesta di reimpostare la password del tuo account Avo. Clicca il pulsante qui sotto per sceglierne una nuova.",
          "</p>",
          "</td></tr>",
          '<tr><td style="padding:0 32px 24px;text-align:center">',
          `<a href="${resetLink}" style="display:inline-block;padding:12px 32px;background:#18181b;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px">Reimposta password</a>`,
          "</td></tr>",
          '<tr><td style="padding:0 32px 32px;text-align:center">',
          '<p style="margin:0;font-size:13px;color:#a1a1aa">Questo link scade tra 1 ora. Se non hai richiesto la reimpostazione, puoi ignorare questa email.</p>',
          "</td></tr>",
          "</table>",
          "</td></tr></table>",
          "</body></html>",
        ].join(""),
      });
    },
  },
  trustedOrigins: getAllowedOrigins(),
  user: {
    additionalFields: {
      phoneNumber: { type: "string" },
    },
  },
  session: {
    additionalFields: {
      activeVenueId: { type: "string" },
    },
  },
});

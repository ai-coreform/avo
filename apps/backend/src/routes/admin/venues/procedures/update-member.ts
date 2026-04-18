import { and, eq } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import database from "@/db";
import { member } from "@/db/schema/auth/member";
import { user } from "@/db/schema/auth/user";
import type { UpdateMemberInput } from "../venues.schemas";

interface UpdateMemberHandlerInput {
  venueId: string;
  userId: string;
}

export async function updateMemberHandler(
  c: Context,
  { venueId, userId }: UpdateMemberHandlerInput,
  body: UpdateMemberInput
) {
  // Verify member exists
  const [memberRow] = await database
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.venueId, venueId), eq(member.userId, userId)))
    .limit(1);

  if (!memberRow) {
    throw new HTTPException(404, { message: "Member not found" });
  }

  // Update user fields
  const userFields: Partial<typeof user.$inferInsert> = {};
  if (body.name !== undefined) {
    userFields.name = body.name;
  }
  if (body.email !== undefined) {
    userFields.email = body.email;
  }
  if (body.phoneNumber !== undefined) {
    userFields.phoneNumber = body.phoneNumber;
  }

  if (Object.keys(userFields).length > 0) {
    await database.update(user).set(userFields).where(eq(user.id, userId));
  }

  // Update member fields
  const memberFields: Partial<typeof member.$inferInsert> = {};
  if (body.role !== undefined) {
    memberFields.role = body.role;
  }
  if (body.isActive !== undefined) {
    memberFields.isActive = body.isActive;
  }

  if (Object.keys(memberFields).length > 0) {
    await database
      .update(member)
      .set(memberFields)
      .where(and(eq(member.venueId, venueId), eq(member.userId, userId)));
  }

  // Return updated data
  const [updatedMember] = await database
    .select({
      userId: member.userId,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phoneNumber,
      role: member.role,
      isActive: member.isActive,
      joinedAt: member.createdAt,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(and(eq(member.venueId, venueId), eq(member.userId, userId)))
    .limit(1);

  return c.json({
    data: {
      ...updatedMember,
      joinedAt: updatedMember.joinedAt.toISOString(),
    },
  });
}

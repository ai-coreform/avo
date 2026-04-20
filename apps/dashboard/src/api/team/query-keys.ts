export const teamQueryKeys = {
  all: ["team"] as const,
  members: () => [...teamQueryKeys.all, "members"] as const,
  invitations: () => [...teamQueryKeys.all, "invitations"] as const,
  activeMember: () => [...teamQueryKeys.all, "active-member"] as const,
};

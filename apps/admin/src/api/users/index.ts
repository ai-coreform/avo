import { client } from "@/lib/api";

export async function listUsers(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const res = await client.api.admin.users.$get({
    query: {
      search: params?.search,
      limit: params?.limit?.toString(),
      offset: params?.offset?.toString(),
    },
  });
  return await res.json();
}

export async function getUser(userId: string) {
  const res = await client.api.admin.users[":userId"].$get({
    param: { userId },
  });
  return await res.json();
}

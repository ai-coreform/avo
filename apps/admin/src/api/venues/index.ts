import { client } from "@/lib/api";

export async function listVenues(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const res = await client.api.admin.venues.$get({
    query: {
      search: params?.search,
      limit: params?.limit?.toString(),
      offset: params?.offset?.toString(),
    },
  });
  return await res.json();
}

export async function getVenue(venueId: string) {
  const res = await client.api.admin.venues[":venueId"].$get({
    param: { venueId },
  });
  return await res.json();
}

export async function deleteVenue(venueId: string) {
  const res = await client.api.admin.venues[":venueId"].$delete({
    param: { venueId },
  });
  return await res.json();
}

export async function setActiveVenue(venueId: string) {
  const res = await client.api.admin.venues[":venueId"]["set-active"].$post({
    param: { venueId },
  });
  return await res.json();
}

export async function updateVenue(
  venueId: string,
  data: Record<string, unknown>
) {
  const res = await client.api.admin.venues[":venueId"].$patch({
    param: { venueId },
    json: data,
  });
  return await res.json();
}

export async function updateMember(
  venueId: string,
  userId: string,
  data: Record<string, unknown>
) {
  const res = await client.api.admin.venues[":venueId"].members[
    ":userId"
  ].$patch({
    param: { venueId, userId },
    json: data,
  });
  return await res.json();
}

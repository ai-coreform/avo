import { client } from "@/lib/api";

export async function getOverviewStats() {
  const res = await client.api.admin.overview.stats.$get();
  return await res.json();
}

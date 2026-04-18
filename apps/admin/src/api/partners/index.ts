import { client } from "@/lib/api";

export async function listPartners() {
  const res = await client.api.admin.partners.$get();
  return await res.json();
}

export async function createPartner(body: {
  slug: string;
  name: string;
  webhook_url: string;
  ip_allowlist?: string[];
}) {
  const res = await client.api.admin.partners.$post({ json: body });
  return await res.json();
}

export async function updatePartner(
  slug: string,
  body: {
    name?: string;
    webhook_url?: string;
    ip_allowlist?: string[];
  }
) {
  const res = await client.api.admin.partners[":slug"].$patch({
    param: { slug },
    json: body,
  });
  return await res.json();
}

export async function rotatePartnerApiKey(slug: string, immediately = false) {
  const res = await client.api.admin.partners[":slug"].rotate.$post({
    param: { slug },
    json: { immediately },
  });
  return await res.json();
}

export async function listPartnerLinks(slug: string) {
  const res = await client.api.admin.partners[":slug"].links.$get({
    param: { slug },
  });
  return await res.json();
}

export async function listPartnerDeliveries(
  slug: string,
  params?: { status?: string; limit?: number }
) {
  const res = await client.api.admin.partners[":slug"].deliveries.$get({
    param: { slug },
    query: {
      status: params?.status,
      limit: params?.limit?.toString(),
    },
  });
  return await res.json();
}

export async function resendDelivery(slug: string, deliveryId: string) {
  const res = await client.api.admin.partners[":slug"].deliveries[
    ":deliveryId"
  ].resend.$post({
    param: { slug, deliveryId },
  });
  return await res.json();
}

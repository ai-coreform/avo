import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPartner,
  listPartnerDeliveries,
  listPartnerLinks,
  listPartners,
  resendDelivery,
  rotatePartnerApiKey,
  updatePartner,
} from ".";

export function useListPartners() {
  return useQuery({
    queryKey: ["admin", "partners"],
    queryFn: listPartners,
  });
}

export function useListPartnerLinks(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["admin", "partners", slug, "links"],
    queryFn: () => listPartnerLinks(slug),
    enabled,
  });
}

export function useListPartnerDeliveries(
  slug: string,
  params?: { status?: string; limit?: number },
  enabled = true
) {
  return useQuery({
    queryKey: ["admin", "partners", slug, "deliveries", params],
    queryFn: () => listPartnerDeliveries(slug, params),
    enabled,
    refetchInterval: 10_000,
  });
}

export function useResendDelivery(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deliveryId: string) => resendDelivery(slug, deliveryId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin", "partners", slug, "deliveries"],
      });
    },
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPartner,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "partners"] });
    },
  });
}

export function useUpdatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      ...body
    }: {
      slug: string;
      name?: string;
      webhook_url?: string;
      ip_allowlist?: string[];
    }) => updatePartner(slug, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "partners"] });
    },
  });
}

export function useRotatePartnerApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      immediately,
    }: {
      slug: string;
      immediately?: boolean;
    }) => rotatePartnerApiKey(slug, immediately ?? false),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "partners"] });
    },
  });
}

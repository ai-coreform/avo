import { useQuery } from "@tanstack/react-query";
import { listUsers } from ".";

export function useListUsers(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["platform", "users", params],
    queryFn: () => listUsers(params),
  });
}

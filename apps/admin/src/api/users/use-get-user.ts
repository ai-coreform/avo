import { useQuery } from "@tanstack/react-query";
import { getUser } from ".";

export function useGetUser(userId: string) {
  return useQuery({
    queryKey: ["platform", "users", userId],
    queryFn: () => getUser(userId),
    enabled: !!userId,
  });
}

import { QueryKey, UseQueryOptions, UseQueryResult } from "react-query";
import { Auth } from "firebase/auth";
import { useSubscription } from "../../utils/src/useSubscription";

export function useAuthUser(
  queryKey: QueryKey,
  auth: Auth,
  options: UseQueryOptions = {}
): UseQueryResult<unknown, unknown> {
  const r = useSubscription(queryKey, "__useAuthUser", auth, options);
  return r;
}

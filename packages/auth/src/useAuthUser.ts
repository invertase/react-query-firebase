import { QueryKey, UseQueryOptions, UseQueryResult } from "react-query";
import { Auth, NextOrObserver, User } from "firebase/auth";
import { useSubscription } from "../../utils/src/useSubscription";

export function useAuthUser(
  queryKey: QueryKey,
  auth: Auth,
  options: UseQueryOptions = {}
): UseQueryResult<unknown, unknown> {
  const subscribeFn = (cb: NextOrObserver<User | null>) =>
    auth.onAuthStateChanged(cb);

  return useSubscription<User | null, User | null>(
    queryKey,
    "useAuthUser",
    subscribeFn,
    options
  );
}

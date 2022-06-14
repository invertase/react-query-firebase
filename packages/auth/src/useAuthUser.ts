import { QueryKey, UseQueryOptions, UseQueryResult } from "react-query";
import { Auth, AuthError, NextOrObserver, User } from "firebase/auth";
import { useSubscription } from "../../utils/src/useSubscription";

export function useAuthUser(
  queryKey: QueryKey,
  auth: Auth,
  options: UseQueryOptions = {}
): UseQueryResult<User, AuthError> {
  const subscribeFn = (cb: NextOrObserver<User | null>) =>
    auth.onAuthStateChanged(cb);

  return useSubscription<User, AuthError>(
    queryKey,
    "useAuthUser",
    subscribeFn,
    options
  );
}

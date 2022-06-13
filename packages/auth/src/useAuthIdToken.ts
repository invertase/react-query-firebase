import { QueryKey, UseQueryOptions, UseQueryResult } from "react-query";
import { Auth, IdTokenResult, NextOrObserver, User } from "firebase/auth";
import { useSubscription } from "../../utils/src/useSubscription";

export function useAuthIdToken(
  queryKey: QueryKey,
  auth: Auth,
  options: UseQueryOptions = {}
): UseQueryResult<unknown, unknown> {
  const subscribeFn = (cb: NextOrObserver<User | null>) =>
    auth.onIdTokenChanged(cb);

  const formatData = async (x: User) => {
    if (x === null) {
      return null;
    }
    const token = await x.getIdTokenResult();
    return { token };
  };
  return useSubscription<User, { token: IdTokenResult }>(
    queryKey,
    "useAuthIdToken",
    subscribeFn,
    {
      ...options,
      formatData,
    }
  );
}

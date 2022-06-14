import { QueryKey, UseQueryOptions, UseQueryResult } from "react-query";
import { Auth, IdTokenResult } from "firebase/auth";
import { useSubscription } from "../../utils/src/useSubscription";

export function useAuthIdToken(
  queryKey: QueryKey,
  auth: Auth,
  options: UseQueryOptions = {}
): UseQueryResult<unknown, unknown> {
  const subscribeFn = (
    callback: (data: { token: IdTokenResult } | null) => Promise<void>
  ) =>
    auth.onIdTokenChanged(async (data) => {
      const token = await data?.getIdTokenResult();

      return callback(token ? { token } : null);
    });

  return useSubscription<{ token: IdTokenResult }>(
    queryKey,
    "useAuthIdToken",
    subscribeFn,
    options
  );
}

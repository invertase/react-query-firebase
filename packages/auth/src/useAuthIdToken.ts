import { QueryKey, UseQueryOptions, UseQueryResult } from "react-query";
import { Auth, AuthError, IdTokenResult } from "firebase/auth";
import { useSubscription } from "../../utils/src/useSubscription";

export function useAuthIdToken<R = { token: IdTokenResult }>(
  queryKey: QueryKey,
  auth: Auth,
  options: Omit<
    UseQueryOptions<{ token: IdTokenResult }, AuthError, R>,
    "queryFn"
  > = {}
): UseQueryResult<R, AuthError> {
  const subscribeFn = (
    callback: (data: { token: IdTokenResult } | null) => Promise<void>
  ) =>
    auth.onIdTokenChanged(async (data) => {
      const token = await data?.getIdTokenResult();

      return callback(token ? { token } : null);
    });

  return useSubscription<{ token: IdTokenResult }, AuthError, R>(
    queryKey,
    "useAuthIdToken",
    subscribeFn,
    options
  );
}

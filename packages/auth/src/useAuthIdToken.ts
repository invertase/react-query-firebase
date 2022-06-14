import { QueryKey, UseQueryOptions, UseQueryResult } from "react-query";
import { Auth, AuthError, IdTokenResult } from "firebase/auth";
import { useSubscription } from "../../utils/src/useSubscription";

export function useAuthIdToken(
  queryKey: QueryKey,
  auth: Auth,
  options: UseQueryOptions = {}
): UseQueryResult<{ token: IdTokenResult }, AuthError> {
  const subscribeFn = (
    callback: (data: { token: IdTokenResult } | null) => Promise<void>
  ) =>
    auth.onIdTokenChanged(async (data) => {
      const token = await data?.getIdTokenResult();

      return callback(token ? { token } : null);
    });

  return useSubscription<{ token: IdTokenResult }, AuthError>(
    queryKey,
    "useAuthIdToken",
    subscribeFn,
    options
  );
}

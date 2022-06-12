import {
  QueryKey,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import { Auth, IdTokenResult, AuthError } from "firebase/auth";
import { Observable } from "rxjs";

export function idTokenFromAuth(
  auth: Auth,
  options?: {
    forceRefresh?: boolean;
  }
): Observable<IdTokenResult | null> {
  return new Observable<IdTokenResult | null>(function subscribe(subscriber) {
    const unsubscribe = auth.onIdTokenChanged(async (user) => {
      let token: IdTokenResult | null = null;

      if (user) {
        token = await user.getIdTokenResult(options?.forceRefresh);
      }

      subscriber.next(token);
    });
    subscriber.add(unsubscribe);
  });
}

export function useAuthIdToken<R = IdTokenResult | null>(
  key: QueryKey,
  auth: Auth,
  options?: {
    forceRefresh?: boolean;
  },
  useSubscriptionOptions?: Omit<
    UseQueryOptions<any | null, AuthError, R>,
    "queryFn"
  >
): UseQueryResult<R | AuthError> {
  return useQuery(key, () => idTokenFromAuth(auth, options), {
    ...useSubscriptionOptions,
  });
}

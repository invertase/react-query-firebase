import { QueryKey } from "react-query";
import { Auth, IdTokenResult, AuthError } from "firebase/auth";
import { Observable } from "rxjs";
import {
  useSubscription,
  UseSubscriptionOptions,
} from "react-query-subscription";
import { UseSubscriptionResult } from "react-query-subscription/types/use-subscription";

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
    UseSubscriptionOptions<IdTokenResult | null, AuthError, R>,
    "queryFn"
  >
): UseSubscriptionResult<R | AuthError> {
  return useSubscription(key, () => idTokenFromAuth(auth, options), {
    ...useSubscriptionOptions,
  });
}

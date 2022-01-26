import { useEffect, useRef } from "react";
import {
  hashQueryKey,
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import { Auth, Unsubscribe, IdTokenResult, AuthError } from "firebase/auth";

import { Completer } from "../../utils/src";

const counts: { [key: string]: number } = {};
const subscriptions: { [key: string]: Unsubscribe } = {};

export function useAuthIdToken<R = IdTokenResult | null>(
  key: QueryKey,
  auth: Auth,
  options?: {
    forceRefresh?: boolean;
  },
  useQueryOptions?: Omit<
    UseQueryOptions<IdTokenResult | null, AuthError, R>,
    "queryFn"
  >
): UseQueryResult<R, AuthError> {
  const client = useQueryClient();
  const completer = useRef<Completer<IdTokenResult | null>>(new Completer());

  const hashFn = useQueryOptions?.queryKeyHashFn || hashQueryKey;
  const hash = hashFn(key);

  useEffect(() => {
    counts[hash] ??= 0;
    counts[hash]++;

    // If there is only one instance of this query key, subscribe
    if (counts[hash] === 1) {
      subscriptions[hash] = auth.onIdTokenChanged(async (user) => {
        let token: IdTokenResult | null = null;

        if (user) {
          token = await user.getIdTokenResult(options?.forceRefresh);
        }

        // Set the data each time state changes.
        client.setQueryData<IdTokenResult | null>(key, token);

        // Resolve the completer with the current data.
        if (!completer.current!.completed) {
          completer.current!.complete(token);
        }
      });
    } else {
      // Since there is already an active subscription, resolve the completer
      // with the cached data.
      completer.current!.complete(client.getQueryData(key) as IdTokenResult | null);
    }

    return () => {
      counts[hash]--;

      if (counts[hash] === 0) {
        subscriptions[hash]();
        delete subscriptions[hash];
      }
    };
  }, [hash, completer]);

  return useQuery<IdTokenResult | null, AuthError, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    queryFn: () => completer.current!.promise,
  });
}

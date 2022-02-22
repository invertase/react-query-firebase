import { useEffect, useRef } from "react";
import {
  hashQueryKey,
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import { Auth, User, Unsubscribe, AuthError } from "firebase/auth";
import { Completer } from "../../utils/src";

const counts: { [key: string]: number } = {};
const subscriptions: { [key: string]: Unsubscribe } = {};

export function useAuthUser<R = User | null>(
  key: QueryKey,
  auth: Auth,
  useQueryOptions?: Omit<UseQueryOptions<User | null, AuthError, R>, "queryFn">
): UseQueryResult<R, AuthError> {
  const client = useQueryClient();
  const completer = useRef<Completer<User | null>>(new Completer());

  const hashFn = useQueryOptions?.queryKeyHashFn || hashQueryKey;
  const hash = hashFn(key);

  useEffect(() => {
    counts[hash] ??= 0;
    counts[hash]++;

    // If there is only one instance of this query key, subscribe
    if (counts[hash] === 1) {
      subscriptions[hash] = auth.onAuthStateChanged((user) => {
        // Set the data each time state changes.
        client.setQueryData<User | null>(key, user);

        // Resolve the completer with the current data.
        if (!completer.current!.completed) {
          completer.current!.complete(user);
        }
      });
    } else {
      // Since there is already an active subscription, resolve the completer
      // with the cached data.
      completer.current!.complete(client.getQueryData(key) as User | null);
    }

    return () => {
      counts[hash]--;

      if (counts[hash] === 0) {
        subscriptions[hash]();
        delete subscriptions[hash];
      }
    };
  }, [hash, completer]);

  return useQuery<User | null, AuthError, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    queryFn: () => completer.current!.promise,
  });
}

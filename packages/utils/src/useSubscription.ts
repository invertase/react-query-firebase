import { Unsubscribe as AuthUnsubscribe } from "firebase/auth";
import { Unsubscribe as FirestoreUnsubscribe } from "firebase/firestore";
import { Unsubscribe as DatabaseUnsubscribe } from "firebase/database";
import { useEffect } from "react";
import {
  hashQueryKey,
  QueryFunction,
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";

type Unsubscribe = AuthUnsubscribe | FirestoreUnsubscribe | DatabaseUnsubscribe;

const unsubscribes: Record<string, any> = {};
const observerCount: Record<string, number> = {};
const eventCount: Record<string, number> = {};

interface CancellablePromise<T = void> extends Promise<T> {
  cancel?: () => void;
}

type UseSubscriptionOptions<TData, TError, R> = UseQueryOptions<
  TData,
  TError,
  R
> & {
  onlyOnce?: boolean;
  fetchFn?: () => Promise<TData>;
};

export function useSubscription<TData, TError, R = TData>(
  queryKey: QueryKey,
  subscriptionKey: QueryKey,
  subscribeFn: (cb: (data: TData | null) => Promise<void>) => Unsubscribe,
  options?: UseSubscriptionOptions<TData, TError, R>
): UseQueryResult<R, TError> {
  useEffect(() => {
    if (!options?.onlyOnce) {
      observerCount[subscriptionHash] += 1;
      return () => {
        observerCount[subscriptionHash] -= 1;
        cleanupSubscription(subscriptionHash);
      };
    }
  }, []);

  const hashFn = options?.queryKeyHashFn || hashQueryKey;
  const subscriptionHash = hashFn(subscriptionKey);

  if (!options?.onlyOnce) {
    observerCount[subscriptionHash] ??= 1;
  }

  const queryClient = useQueryClient();

  function cleanupSubscription(subscriptionHash: string) {
    if (observerCount[subscriptionHash] === 1) {
      const unsubscribe = unsubscribes[subscriptionHash];
      unsubscribe();
      delete unsubscribes[subscriptionHash];
    }
  }

  let resolvePromise: (data: TData | null) => void = () => null;

  const result: CancellablePromise<TData | null> = new Promise<TData | null>(
    (resolve) => {
      resolvePromise = resolve;
    }
  );

  result.cancel = () => {
    queryClient.invalidateQueries(queryKey);
  };

  let unsubscribe: Unsubscribe;
  if (!options?.onlyOnce) {
    if (unsubscribes[subscriptionHash]) {
      unsubscribe = unsubscribes[subscriptionHash];
      const old = queryClient.getQueryData<TData | null>(queryKey);

      resolvePromise(old || null);
    } else {
      unsubscribe = subscribeFn(async (data) => {
        eventCount[subscriptionHash] ??= 0;
        eventCount[subscriptionHash]++;
        if (eventCount[subscriptionHash] === 1) {
          resolvePromise(data || null);
        } else {
          queryClient.setQueryData(queryKey, data);
        }
      });
      unsubscribes[subscriptionHash] = unsubscribe;
    }
  } else {
    if (!options.fetchFn) {
      throw new Error("please specify fetchFn");
    } else {
      options.fetchFn().then((res: TData) => resolvePromise(res));
    }
  }

  const queryFn: QueryFunction<TData, QueryKey> = () => {
    return result as Promise<TData>;
  };

  return useQuery<TData, TError, R>({
    ...options,
    queryFn,
    queryKey,
    retry: false,
    staleTime: Infinity,
    refetchInterval: undefined,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

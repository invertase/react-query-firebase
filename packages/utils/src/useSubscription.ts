import { Unsubscribe } from "firebase/auth";
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

const unsubscribes: Record<string, any> = {};
const observerCount: Record<string, number> = {};
const eventCount: Record<string, number> = {};

interface CancellablePromise<T = void> extends Promise<T> {
  cancel?: () => void;
}

export function useSubscription<TData, TError, R = TData>(
  queryKey: QueryKey,
  subscriptionKey: QueryKey,
  subscribeFn: (cb: (data: TData | null) => Promise<void>) => Unsubscribe,
  options?: UseQueryOptions<TData, TError, R>,
  disableSubscribe?: boolean,
  fetchFn?: () => Promise<TData>
): UseQueryResult<R, TError> {
  useEffect(() => {
    if (!disableSubscribe) {
      observerCount[subscriptionHash] += 1;
      return () => {
        console.log("cleanup");

        observerCount[subscriptionHash] -= 1;
        cleanupSubscription(subscriptionHash);
      };
    }
  }, []);

  const hashFn = options?.queryKeyHashFn || hashQueryKey;
  const subscriptionHash = hashFn(subscriptionKey);

  if (!disableSubscribe) {
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

  let resolvePromise: (data: TData | null) => void = () => undefined;

  const result: CancellablePromise<TData | null> = new Promise<TData | null>(
    (resolve) => {
      resolvePromise = resolve;
    }
  );

  result.cancel = () => {
    queryClient.invalidateQueries(queryKey);
  };

  let unsubscribe: Unsubscribe;
  if (!disableSubscribe) {
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
    if (!fetchFn) {
      throw new Error("please specify fetchFn");
    } else {
      fetchFn().then((res: TData) => resolvePromise(res));
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

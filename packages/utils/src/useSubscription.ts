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

export function useSubscription<TData, TError>(
  queryKey: QueryKey,
  subscriptionKey: QueryKey,
  subscribeFn: (cb: (data: TData | null) => Promise<void>) => Unsubscribe,
  options: UseQueryOptions
): UseQueryResult<TData, TError> {
  const hashFn = options?.queryKeyHashFn || hashQueryKey;
  const subscriptionHash = hashFn(subscriptionKey);

  observerCount[subscriptionHash] ??= 1;

  const queryClient = useQueryClient();

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

  const queryFn: QueryFunction<TData, QueryKey> = () => {
    return result as Promise<TData>;
  };

  useEffect(() => {
    observerCount[subscriptionHash] += 1;
    return () => {
      observerCount[subscriptionHash] -= 1;
      cleanupSubscription(subscriptionHash);
    };
  }, []);

  return useQuery<TData, TError, TData>({
    ...(options as Partial<UseQueryOptions<TData, TError, TData>>),
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

function cleanupSubscription(subscriptionHash: string) {
  if (observerCount[subscriptionHash] === 1) {
    const unsubscribe = unsubscribes[subscriptionHash];
    unsubscribe();
    delete unsubscribes[subscriptionHash];
  }
}

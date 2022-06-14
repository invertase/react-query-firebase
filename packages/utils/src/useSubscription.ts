import { Unsubscribe } from "firebase/auth";
import { useEffect } from "react";
import {
  hashQueryKey,
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";

const unsubscribes: Record<string, any> = {};
const observerCount: Record<string, number> = {};
const eventCount: Record<string, number> = {};

export function useSubscription<TData>(
  queryKey: QueryKey,
  subscriptionKey: QueryKey,
  subscribeFn: (cb: (data: TData | null) => Promise<void>) => Unsubscribe,
  options: UseQueryOptions
): UseQueryResult<unknown, unknown> {
  const hashFn = options?.queryKeyHashFn || hashQueryKey;
  const subscriptionHash = hashFn(subscriptionKey);

  observerCount[subscriptionHash] ??= 1;

  const queryClient = useQueryClient();

  let resolvePromise: (data: TData | null) => void = () => undefined;

  const result: Promise<TData | null> & { cancel?: () => void } =
    new Promise<TData | null>((resolve) => {
      resolvePromise = resolve;
    });

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

  const queryFn = () => {
    return result;
  };

  useEffect(() => {
    observerCount[subscriptionHash] += 1;
    return () => {
      observerCount[subscriptionHash] -= 1;
      cleanupSubscription(subscriptionHash);
    };
  }, []);

  return useQuery({
    ...options,
    queryFn: queryFn,
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

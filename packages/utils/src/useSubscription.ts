import { NextOrObserver, Unsubscribe } from "firebase/auth";
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

export function useSubscription<TData, TFormattedData>(
  queryKey: QueryKey,
  subscriptionKey: QueryKey,
  subscribeFn: (nextOrObserver: NextOrObserver<TData | null>) => Unsubscribe,
  options: UseQueryOptions & {
    formatData?: (x: TData | null) => Promise<TFormattedData | null>;
  }
): UseQueryResult<unknown, unknown> {
  const hashFn = options?.queryKeyHashFn || hashQueryKey;
  const subscriptionHash = hashFn(subscriptionKey);

  observerCount[subscriptionHash] ??= 1;

  const queryClient = useQueryClient();

  let resolvePromise: (data: TFormattedData | null) => void = () => undefined;

  const result: Promise<TFormattedData | null> & { cancel?: () => void } =
    new Promise<TFormattedData | null>((resolve) => {
      resolvePromise = resolve;
    });

  result.cancel = () => {
    queryClient.invalidateQueries(queryKey);
  };

  let unsubscribe: Unsubscribe;

  if (unsubscribes[subscriptionHash]) {
    unsubscribe = unsubscribes[subscriptionHash];
    const old = queryClient.getQueryData<TFormattedData | null>(queryKey);
    resolvePromise(old || null);
  } else {
    unsubscribe = subscribeFn(async (data) => {
      const formattedData = (await options?.formatData?.(data)) ?? data;

      eventCount[subscriptionHash] ??= 0;
      eventCount[subscriptionHash]++;
      if (eventCount[subscriptionHash] === 1) {
        resolvePromise(formattedData || null);
      } else {
        queryClient.setQueryData(queryKey, formattedData);
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

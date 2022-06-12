import { NextOrObserver, Unsubscribe, User } from "firebase/auth";
import { useEffect } from "react";
import {
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";

let count = 0;
const unsubscribes: Record<string, any> = {};
type TData = User | null;

const unsubscribesCount: Record<string, any> = {};

export function useSubscription(
  queryKey: QueryKey,
  subscriptionKey: QueryKey,
  subscribeFn: (nextOrObserver: NextOrObserver<User | null>) => Unsubscribe,
  options: UseQueryOptions
): UseQueryResult<unknown, unknown> {
  const queryClient = useQueryClient();

  let resolvePromise: (data: TData) => void = () => undefined;

  const result: Promise<TData> & { cancel?: () => void } = new Promise<TData>(
    (resolve) => {
      resolvePromise = resolve;
    }
  );

  result.cancel = () => {
    queryClient.invalidateQueries(queryKey);
  };

  let unsubscribe: Unsubscribe;

  if (unsubscribes[JSON.stringify(subscriptionKey)]) {
    unsubscribe = unsubscribes[JSON.stringify(subscriptionKey)];
    const old = queryClient.getQueryData<TData>(queryKey);
    resolvePromise(old || null);
  } else {
    unsubscribe = subscribeFn((data) => {
      count++;
      if (count === 1) {
        resolvePromise(data || null);
      } else {
        queryClient.setQueryData(queryKey, data);
      }
    });
    unsubscribes[JSON.stringify(subscriptionKey)] = unsubscribe;
  }

  const queryFn = () => {
    return result;
  };

  useEffect(() => {
    return function cleanup() {
      cleanupSubscription(subscriptionKey);
    };
  }, []);

  const r = useQuery({
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
  return r;
}

function cleanupSubscription(subscriptionKey: QueryKey) {
  if (unsubscribesCount[JSON.stringify(subscriptionKey)] === 1) {
    const unsubscribe = unsubscribes[JSON.stringify(subscriptionKey)];
    unsubscribe();
    delete unsubscribes[JSON.stringify(subscriptionKey)];
  }
}

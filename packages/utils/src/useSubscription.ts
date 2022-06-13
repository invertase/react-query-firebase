import { NextOrObserver, Unsubscribe, User } from "firebase/auth";
import { useEffect } from "react";
import {
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";

const unsubscribes: Record<string, any> = {};
type TData = User | null;

const observerCount: Record<string, number> = {};
const eventCount: Record<string, number> = {};

export function useSubscription(
  queryKey: QueryKey,
  subscriptionKey: QueryKey,
  subscribeFn: (nextOrObserver: NextOrObserver<User | null>) => Unsubscribe,
  options: UseQueryOptions
): UseQueryResult<unknown, unknown> {
  observerCount[JSON.stringify(subscriptionKey)] ??= 1;

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
      eventCount[JSON.stringify(subscriptionKey)] ??= 0;
      eventCount[JSON.stringify(subscriptionKey)]++;
      if (eventCount[JSON.stringify(subscriptionKey)] === 1) {
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
    observerCount[JSON.stringify(subscriptionKey)] += 1;
    console.log("run useEffect");

    return function cleanup() {
      observerCount[JSON.stringify(subscriptionKey)] -= 1;
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
  console.log(r);

  return r;
}

function cleanupSubscription(subscriptionKey: QueryKey) {
  if (observerCount[JSON.stringify(subscriptionKey)] === 1) {
    console.log("cleaning up");
    const unsubscribe = unsubscribes[JSON.stringify(subscriptionKey)];
    unsubscribe();
    delete unsubscribes[JSON.stringify(subscriptionKey)];
  }
}

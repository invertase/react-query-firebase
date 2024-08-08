/*
 * Copyright (c) 2016-present Invertase Limited & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this library except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import { Unsubscribe as AuthUnsubscribe } from "firebase/auth";
import { Unsubscribe as FirestoreUnsubscribe } from "firebase/firestore";
import { Unsubscribe as DatabaseUnsubscribe } from "firebase/database";
import { useEffect } from "react";
import {
  hashKey,
  QueryFunction,
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

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

/**
 * Utility hook to subscribe to events, given a function that returns an observer callback.
 * @param queryKey The react-query queryKey
 * @param subscriptionKey A hashable key to store the subscription
 * @param subscribeFn Returns an unsubscribe function to the event
 * @param options
 * @returns
 */
export function useSubscription<TData, TError, R = TData>(
  queryKey: QueryKey,
  subscriptionKey: QueryKey,
  subscribeFn: (cb: (data: TData | null) => Promise<void>) => Unsubscribe,
  options?: UseSubscriptionOptions<TData, TError, R>
): UseQueryResult<R, TError> {
  const hashFn = options?.queryKeyHashFn || hashKey;
  const subscriptionHash = hashFn(subscriptionKey);
  const queryClient = useQueryClient();

  if (!options?.onlyOnce) {
    // if it's a subscription, we have at least one observer now
    observerCount[subscriptionHash] ??= 1;
  }

  function cleanupSubscription(subscriptionHash: string) {
    if (observerCount[subscriptionHash] === 1) {
      const unsubscribe = unsubscribes[subscriptionHash];
      unsubscribe();
      delete unsubscribes[subscriptionHash];
      delete eventCount[subscriptionHash];
    }
  }

  useEffect(() => {
    if (!options?.onlyOnce) {
      observerCount[subscriptionHash] += 1;
      return () => {
        observerCount[subscriptionHash] -= 1;
          cleanupSubscription(subscriptionHash);
      };
    }
  }, []);

  let resolvePromise: (data: TData | null) => void = () => null;
  let rejectPromise: (err: any) => void = () => null;
  const result: CancellablePromise<TData | null> = new Promise<TData | null>(
    (resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    }
  );

  result.cancel = () => {
    queryClient.invalidateQueries({
      queryKey,
    });
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
      throw new Error("You must specify fetchFn if using onlyOnce mode.");
    } else {
      options
        .fetchFn()
        .then(resolvePromise)
        .catch((err) => {
          rejectPromise(err);
        });
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

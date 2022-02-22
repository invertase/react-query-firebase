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

import { useEffect, useRef } from "react";
import {
  useQuery,
  useQueryClient,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
  hashQueryKey,
} from "react-query";
import {
  onSnapshot,
  Unsubscribe,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from "firebase/firestore";
import {
  getQuerySnapshot,
  QueryType,
  resolveQuery,
  UseFirestoreHookOptions,
} from "./index";
import { Completer } from "../../utils/src";

const counts: { [key: string]: number } = {};
const subscriptions: { [key: string]: Unsubscribe } = {};

export function useFirestoreQuery<T = DocumentData, R = QuerySnapshot<T>>(
  key: QueryKey,
  query: QueryType<T>,
  options?: UseFirestoreHookOptions,
  useQueryOptions?: Omit<
    UseQueryOptions<QuerySnapshot<T>, FirestoreError, R>,
    "queryFn"
  >
): UseQueryResult<R, FirestoreError> {
  const client = useQueryClient();
  const completer = useRef<Completer<QuerySnapshot<T>>>(new Completer());

  const hashFn = useQueryOptions?.queryKeyHashFn || hashQueryKey;
  const hash = hashFn(key);
  const isSubscription = !!options?.subscribe;

  useEffect(() => {
    if (!isSubscription) {
      resolveQuery(query)
        .then((resolvedQuery) => {
          return getQuerySnapshot(resolvedQuery, options?.source);
        })
        .then((snapshot) => {
          completer.current!.complete(snapshot);
        })
        .catch((error) => {
          completer.current!.reject(error);
        });
    }
  }, [isSubscription, hash, completer]);

  useEffect(() => {
    if (isSubscription) {
      counts[hash] ??= 0;
      counts[hash]++;

      // If there is only one instance of this query key, subscribe
      if (counts[hash] === 1) {
        resolveQuery(query)
          .then((resolveQuery) => {
            subscriptions[hash] = onSnapshot(
              resolveQuery,
              {
                includeMetadataChanges: options?.includeMetadataChanges,
              },
              (snapshot) => {
                // Set the data each time state changes.
                client.setQueryData<QuerySnapshot<T>>(key, snapshot);

                // Resolve the completer with the current data.
                if (!completer.current!.completed) {
                  completer.current!.complete(snapshot);
                }
              },
              (error) => {
                completer.current!.reject(error);
              }
            );
          })
          .catch((error) => {
            completer.current!.reject(error);
          });
      } else {
        // Since there is already an active subscription, resolve the completer
        // with the cached data.
        completer.current!.complete(
          client.getQueryData(key) as QuerySnapshot<T>
        );
      }

      return () => {
        counts[hash]--;

        if (counts[hash] === 0) {
          subscriptions[hash]();
          delete subscriptions[hash];
        }
      };
    }
  }, [isSubscription, hash, completer]);

  return useQuery<QuerySnapshot<T>, FirestoreError, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    queryFn: () => completer.current!.promise,
  });
}

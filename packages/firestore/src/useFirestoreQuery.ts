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

import { useCallback } from "react";
import { QueryKey, UseQueryOptions, UseQueryResult } from "react-query";
import {
  onSnapshot,
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
import { useSubscription } from "../../utils/src/useSubscription";

type NextOrObserver<T> = (data: QuerySnapshot<T> | null) => Promise<void>;

export function useFirestoreQuery<T = DocumentData, R = QuerySnapshot<T>>(
  queryKey: QueryKey,
  query: QueryType<T>,
  options?: UseFirestoreHookOptions,
  useQueryOptions?: Omit<
    UseQueryOptions<QuerySnapshot<T>, FirestoreError, R>,
    "queryFn"
  >
): UseQueryResult<R, FirestoreError> {
  const isSubscription = !!options?.subscribe;

  const subscribeFn = useCallback(
    (callback: NextOrObserver<T>) => {
      let unsubscribe = () => {
        // noop
      };
      resolveQuery(query).then((res) => {
        unsubscribe = onSnapshot(
          res,
          {
            includeMetadataChanges: options?.includeMetadataChanges,
          },
          (snapshot: QuerySnapshot<T>) => {
            return callback(snapshot);
          }
        );
      });
      return unsubscribe;
    },
    [query, queryKey]
  );

  return useSubscription<QuerySnapshot<T>, FirestoreError, R>(
    queryKey,
    ["useFirestoreDocument", queryKey],
    subscribeFn,
    {
      ...useQueryOptions,
      onlyOnce: !isSubscription,
      fetchFn: () =>
        resolveQuery(query).then((resolvedQuery) => {
          return getQuerySnapshot(resolvedQuery, options?.source);
        }),
    }
  );
}

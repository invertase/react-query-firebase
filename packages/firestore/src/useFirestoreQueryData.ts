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
  DocumentData,
  SnapshotOptions,
  FirestoreError,
  QuerySnapshot,
} from "firebase/firestore";
import {
  getQuerySnapshot,
  GetSnapshotSource,
  QueryType,
  resolveQuery,
  UseFirestoreHookOptions,
  WithIdField,
} from "./index";
import { useSubscription } from "../../utils/src/useSubscription";

type NextOrObserver<T, ID> = (
  data: WithIdField<T, ID>[] | null
) => Promise<void>;

export function useFirestoreQueryData<T = DocumentData, R = WithIdField<T>[]>(
  key: QueryKey,
  query: QueryType<T>,
  options?: UseFirestoreHookOptions & SnapshotOptions,
  useQueryOptions?: Omit<
    UseQueryOptions<WithIdField<T>[], FirestoreError, R>,
    "queryFn"
  >
): UseQueryResult<R, FirestoreError>;

export function useFirestoreQueryData<
  ID extends string,
  T = DocumentData,
  R = WithIdField<T, ID>[]
>(
  key: QueryKey,
  query: QueryType<T>,
  options?: UseFirestoreHookOptions & SnapshotOptions & { idField: ID },
  useQueryOptions?: Omit<
    UseQueryOptions<WithIdField<T, ID>[], FirestoreError, R>,
    "queryFn"
  >
): UseQueryResult<R, FirestoreError>;

export function useFirestoreQueryData<
  ID extends string,
  T = DocumentData,
  R = WithIdField<T, ID>[]
>(
  queryKey: QueryKey,
  query: QueryType<T>,
  options?: UseFirestoreHookOptions & SnapshotOptions & { idField?: ID },
  useQueryOptions?: Omit<
    UseQueryOptions<WithIdField<T, ID>[], FirestoreError, R>,
    "queryFn"
  >
): UseQueryResult<R, FirestoreError> {
  const isSubscription = !!options?.subscribe;

  let source: GetSnapshotSource | undefined;
  let includeMetadataChanges: boolean | undefined;

  if (options?.subscribe === undefined) {
    source = options?.source;
  }
  if (options?.subscribe) {
    includeMetadataChanges = options.includeMetadataChanges;
  }

  const subscribeFn = useCallback(
    (callback: NextOrObserver<T, ID>) => {
      let unsubscribe = () => {
        // noop
      };
      resolveQuery(query).then((res) => {
        unsubscribe = onSnapshot(
          res,
          {
            includeMetadataChanges,
          },
          (snapshot: QuerySnapshot<T>) => {
            const docs = snapshot.docs.map((doc) => {
              const data = doc.data({
                serverTimestamps: options?.serverTimestamps,
              });
              if (options?.idField) {
                const withIdData = {
                  ...data,
                  [options.idField as ID]: doc.id,
                } as WithIdField<T, ID>;
                return withIdData;
              }

              return data as WithIdField<T, ID>;
            });
            callback(docs);
          }
        );
      });
      return unsubscribe;
    },
    [query, queryKey]
  );
  const fetchFn = async () => {
    const resolvedQuery = await resolveQuery(query);

    const snapshot = await getQuerySnapshot(resolvedQuery, source);

    return snapshot.docs.map((doc) => {
      let data = doc.data({
        serverTimestamps: options?.serverTimestamps,
      });

      if (options?.idField) {
        data = {
          ...data,
          [options.idField]: doc.id,
        };
      }

      return data as WithIdField<T, ID>;
    });
  };
  return useSubscription<WithIdField<T, ID>[], FirestoreError, R>(
    queryKey,
    ["useFirestoreDocument", queryKey],
    subscribeFn,
    { ...useQueryOptions, onlyOnce: !isSubscription, fetchFn }
  );
}

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
} from "react-query";
import {
  onSnapshot,
  Unsubscribe,
  DocumentData,
  SnapshotOptions,
  FirestoreError,
} from "firebase/firestore";
import {
  getQuerySnapshot,
  QueryType,
  resolveQuery,
  UseFirestoreHookOptions,
  WithIdField,
} from "./index";

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
  key: QueryKey,
  query: QueryType<T>,
  options?: UseFirestoreHookOptions & SnapshotOptions & { idField?: ID },
  useQueryOptions?: Omit<
    UseQueryOptions<WithIdField<T, ID>[], FirestoreError, R>,
    "queryFn"
  >
): UseQueryResult<R, FirestoreError> {
  const client = useQueryClient();
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    return () => unsubscribe.current?.();
  }, []);

  return useQuery<WithIdField<T, ID>[], FirestoreError, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    staleTime:
      useQueryOptions?.staleTime ?? options?.subscribe ? Infinity : undefined,
    async queryFn(): Promise<WithIdField<T, ID>[]> {
      unsubscribe.current?.();

      const _query = await resolveQuery(query);

      if (!options?.subscribe) {
        const snapshot = await getQuerySnapshot(_query, options?.source);

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
      }

      let resolved = false;

      return new Promise<WithIdField<T, ID>[]>((resolve, reject) => {
        unsubscribe.current = onSnapshot(
          _query,
          {
            includeMetadataChanges: options?.includeMetadataChanges,
          },
          (snapshot) => {
            const docs = snapshot.docs.map((doc) => {
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

            if (!resolved) {
              resolved = true;
              return resolve(docs);
            } else {
              client.setQueryData<WithIdField<T, ID>[]>(key, docs);
            }
          },
          reject
        );
      });
    },
  });
}

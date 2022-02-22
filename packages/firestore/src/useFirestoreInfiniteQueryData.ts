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

import {
  QueryKey,
  useInfiniteQuery,
  QueryFunctionContext,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from "react-query";
import {
  Query,
  DocumentData,
  SnapshotOptions,
  FirestoreError,
} from "firebase/firestore";
import { getQuerySnapshot, GetSnapshotSource, WithIdField } from "./index";

export function useFirestoreInfiniteQueryData<
  T = DocumentData,
  R = WithIdField<T>[]
>(
  key: QueryKey,
  initialQuery: Query<T>,
  getNextQuery: (data: T[]) => Query<T> | undefined,
  getPreviousQuery: (data: T[]) => Query<T> | undefined,
  options?: {
    source?: GetSnapshotSource;
  } & SnapshotOptions,
  useInfiniteQueryOptions?: Omit<
    UseInfiniteQueryOptions<WithIdField<T>[], FirestoreError, R>,
    "queryFn" | "getNextPageParam" | "getPreviousPageParam"
  >
): UseInfiniteQueryResult<R, FirestoreError>;

export function useFirestoreInfiniteQueryData<
  ID extends string,
  T = DocumentData,
  R = WithIdField<T, ID>[]
>(
  key: QueryKey,
  initialQuery: Query<T>,
  getNextQuery: (data: T[]) => Query<T> | undefined,
  getPreviousQuery: (data: T[]) => Query<T> | undefined,
  options?: {
    source?: GetSnapshotSource;
  } & SnapshotOptions & { idField: ID },
  useInfiniteQueryOptions?: Omit<
    UseInfiniteQueryOptions<WithIdField<T, ID>[], FirestoreError, R>,
    "queryFn" | "getNextPageParam" | "getPreviousPageParam"
  >
): UseInfiniteQueryResult<R, FirestoreError>;

export function useFirestoreInfiniteQueryData<
  ID extends string,
  T = DocumentData,
  R = WithIdField<T, ID>[]
>(
  key: QueryKey,
  initialQuery: Query<T>,
  getNextQuery: (data: T[]) => Query<T> | undefined,
  getPreviousQuery: (data: T[]) => Query<T> | undefined,
  options?: {
    source?: GetSnapshotSource;
  } & SnapshotOptions & { idField?: ID },
  useInfiniteQueryOptions?: Omit<
    UseInfiniteQueryOptions<WithIdField<T, ID>[], FirestoreError, R>,
    "queryFn" | "getNextPageParam" | "getPreviousPageParam"
  >
): UseInfiniteQueryResult<R, FirestoreError> {
  return useInfiniteQuery<WithIdField<T, ID>[], FirestoreError, R>({
    queryKey: useInfiniteQueryOptions?.queryKey ?? key,
    async queryFn(
      ctx: QueryFunctionContext<QueryKey, Query<T>>
    ): Promise<WithIdField<T, ID>[]> {
      const query: Query<T> = ctx.pageParam ?? initialQuery;
      const snapshot = await getQuerySnapshot(query, options?.source);

      return snapshot.docs.map((doc) => {
        let data = doc.data({ serverTimestamps: options?.serverTimestamps });

        if (options?.idField) {
          data = {
            ...data,
            [options.idField]: doc.id,
          };
        }

        return data as WithIdField<T, ID>;
      });
    },
    getNextPageParam(data) {
      return getNextQuery(data);
    },
    getPreviousPageParam(data) {
      return getPreviousQuery(data);
    },
  });
}

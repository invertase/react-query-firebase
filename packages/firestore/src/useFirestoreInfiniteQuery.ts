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
  QuerySnapshot,
  DocumentData,
  FirestoreError,
} from "firebase/firestore";
import { getQuerySnapshot, GetSnapshotSource } from "./index";

export function useFirestoreInfiniteQuery<
  T = DocumentData,
  R = QuerySnapshot<T>
>(
  key: QueryKey,
  initialQuery: Query<T>,
  getNextQuery: (snapshot: QuerySnapshot<T>) => Query<T> | undefined,
  getPreviousQuery: (snapshot: QuerySnapshot<T>) => Query<T> | undefined,
  options?: {
    source?: GetSnapshotSource;
  },
  useInfiniteQueryOptions?: Omit<
    UseInfiniteQueryOptions,
    "queryFn" | "getNextPageParam" | "getPreviousPageParam"
  >
): UseInfiniteQueryResult<R, FirestoreError> {
  return useInfiniteQuery<QuerySnapshot<T>, FirestoreError, R>({
    queryKey: useInfiniteQueryOptions?.queryKey ?? key,
    async queryFn(ctx: QueryFunctionContext<QueryKey, Query<T>>) {
      const query: Query<T> = ctx.pageParam ?? initialQuery;
      return getQuerySnapshot(query, options?.source);
    },
    getNextPageParam(snapshot) {
      return getNextQuery(snapshot);
    },
    getPreviousPageParam(snapshot) {
      return getPreviousQuery(snapshot);
    },
  });
}

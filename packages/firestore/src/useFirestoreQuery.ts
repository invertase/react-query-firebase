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
  useInfiniteQuery,
  QueryFunctionContext,
  UseInfiniteQueryOptions,
  UseQueryResult,
  UseInfiniteQueryResult,
} from "react-query";
import {
  getDocs,
  Query,
  onSnapshot,
  Unsubscribe,
  QuerySnapshot,
  getDocsFromCache,
  getDocsFromServer,
  namedQuery as firestoreNamedQuery,
  DocumentData,
  Firestore,
  SnapshotOptions,
  FirestoreError,
} from "firebase/firestore";
import {
  GetSnapshotSource,
  UseFirestoreHookOptions,
  WithIdField,
} from "./index";

const namedQueryCache: { [key: string]: Query } = {};

export type NamedQueryPromise<T> = () => Promise<Query<T> | null>;

export type NamedQuery<T = DocumentData> = Query<T> | NamedQueryPromise<T>;

export type QueryType<T> = Query<T> | NamedQuery<T>;

function isNamedQuery<T>(query: QueryType<T>): query is NamedQuery<T> {
  return typeof query === "function";
}

export async function resolveQuery<T>(query: QueryType<T>): Promise<Query<T>> {
  if (isNamedQuery(query)) {
    if (typeof query === "function") {
      // Firebase throws an error if the query doesn't exist.
      const resolved = await query();
      return resolved!;
    }

    return query;
  }

  return query;
}

async function getSnapshot<T>(query: Query<T>, source?: GetSnapshotSource) {
  let snapshot: QuerySnapshot<T>;

  if (source === "cache") {
    snapshot = await getDocsFromCache(query);
  } else if (source === "server") {
    snapshot = await getDocsFromServer(query);
  } else {
    snapshot = await getDocs(query);
  }

  return snapshot;
}

export function namedQuery<T>(
  firestore: Firestore,
  name: string
): NamedQuery<T> {
  const key = `${firestore.app.name}:${name}`;

  if (namedQueryCache[key]) {
    return namedQueryCache[key] as Query<T>;
  }

  return () =>
    firestoreNamedQuery(firestore, name).then((query) => {
      if (query) {
        namedQueryCache[key] = query;
        return query as Query<T>;
      }

      return null;
    });
}

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
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    return () => unsubscribe.current?.();
  }, []);

  return useQuery<QuerySnapshot<T>, FirestoreError, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    staleTime:
      useQueryOptions?.staleTime ?? options?.subscribe ? Infinity : undefined,
    async queryFn() {
      unsubscribe.current?.();

      const _query = await resolveQuery(query);

      if (!options?.subscribe) {
        return getSnapshot(_query, options?.source);
      }

      let resolved = false;

      return new Promise<QuerySnapshot<T>>((resolve, reject) => {
        unsubscribe.current = onSnapshot(
          _query,
          {
            includeMetadataChanges: options?.includeMetadataChanges,
          },
          (snapshot) => {
            if (!resolved) {
              resolved = true;
              return resolve(snapshot);
            } else {
              client.setQueryData<QuerySnapshot<T>>(key, snapshot);
            }
          },
          reject
        );
      });
    },
  });
}

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
        const snapshot = await getSnapshot(_query, options?.source);

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

export function useFirestoreInfiniteQuery<
  T = DocumentData,
  R = QuerySnapshot<T>
>(
  key: QueryKey,
  initialQuery: Query<T>,
  getNextQuery: (snapshot: QuerySnapshot<T>) => Query<T> | undefined,
  options?: {
    source?: GetSnapshotSource;
  },
  useInfiniteQueryOptions?: Omit<
    UseInfiniteQueryOptions,
    "queryFn" | "getNextPageParam"
  >
): UseInfiniteQueryResult<R, FirestoreError> {
  return useInfiniteQuery<QuerySnapshot<T>, FirestoreError, R>({
    queryKey: useInfiniteQueryOptions?.queryKey ?? key,
    async queryFn(ctx: QueryFunctionContext<QueryKey, Query<T>>) {
      const query: Query<T> = ctx.pageParam ?? initialQuery;
      return getSnapshot(query, options?.source);
    },
    getNextPageParam(snapshot) {
      return getNextQuery(snapshot);
    },
  });
}

export function useFirestoreInfiniteQueryData<
  T = DocumentData,
  R = WithIdField<T>[]
>(
  key: QueryKey,
  initialQuery: Query<T>,
  getNextQuery: (data: T[]) => Query<T> | undefined,
  options?: {
    source?: GetSnapshotSource;
  } & SnapshotOptions,
  useInfiniteQueryOptions?: Omit<
    UseInfiniteQueryOptions<WithIdField<T>[], FirestoreError, R>,
    "queryFn" | "getNextPageParam"
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
  options?: {
    source?: GetSnapshotSource;
  } & SnapshotOptions & { idField: ID },
  useInfiniteQueryOptions?: Omit<
    UseInfiniteQueryOptions<WithIdField<T, ID>[], FirestoreError, R>,
    "queryFn" | "getNextPageParam"
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
  options?: {
    source?: GetSnapshotSource;
  } & SnapshotOptions & { idField?: ID },
  useInfiniteQueryOptions?: Omit<
    UseInfiniteQueryOptions<WithIdField<T, ID>[], FirestoreError, R>,
    "queryFn" | "getNextPageParam"
  >
): UseInfiniteQueryResult<R, FirestoreError> {
  return useInfiniteQuery<WithIdField<T, ID>[], FirestoreError, R>({
    queryKey: useInfiniteQueryOptions?.queryKey ?? key,
    async queryFn(
      ctx: QueryFunctionContext<QueryKey, Query<T>>
    ): Promise<WithIdField<T, ID>[]> {
      const query: Query<T> = ctx.pageParam ?? initialQuery;
      const snapshot = await getSnapshot(query, options?.source);

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
  });
}

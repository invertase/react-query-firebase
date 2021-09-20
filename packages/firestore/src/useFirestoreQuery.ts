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
} from "firebase/firestore";
import { GetSnapshotSource, UseFirestoreHookOptions } from "./index";

const namedQueryCache: { [key: string]: Query } = {};

type NamedQueryPromise<T> = () => Promise<Query<T> | null>;

type NamedQuery<T> = Query<T> | NamedQueryPromise<T>;

type QueryType<T> = Query<T> | NamedQuery<T>;

function isNamedQuery<T>(query: QueryType<T>): query is NamedQuery<T> {
  return typeof query === "function";
}

export async function resolveQuery<T>(query: QueryType<T>): Promise<Query<T>> {
  if (isNamedQuery(query)) {
    if (typeof query === "function") {
      const resolved = await query();

      if (!resolved) {
        throw new Error(
          "A named query returned no response. Ensure you have loaded the remote bundle containing the same named key."
        );
      }

      return resolved;
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
  useQueryOptions?: Omit<UseQueryOptions<QuerySnapshot<T>, Error, R>, "queryFn">
) {
  const client = useQueryClient();
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    return () => unsubscribe.current?.();
  }, []);

  return useQuery<QuerySnapshot<T>, Error, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      unsubscribe.current?.();

      const _query = await resolveQuery(query);

      if (!options?.subscribe) {
        return getSnapshot(_query, options?.source);
      }

      let resolved = false;

      return new Promise<QuerySnapshot<T>>((resolve) => {
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
          }
        );
      });
    },
  });
}

export function useFirestoreQueryData<T = DocumentData, R = T[]>(
  key: QueryKey,
  query: QueryType<T>,
  options?: UseFirestoreHookOptions & SnapshotOptions,
  useQueryOptions?: Omit<UseQueryOptions<T[], Error, R>, "queryFn">
) {
  const client = useQueryClient();
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    return () => unsubscribe.current?.();
  }, []);

  return useQuery<T[], Error, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      unsubscribe.current?.();

      const _query = await resolveQuery(query);

      if (!options?.subscribe) {
        const snapshot = await getSnapshot(_query, options?.source);

        return snapshot.docs.map((doc) =>
          doc.data({
            serverTimestamps: options?.serverTimestamps,
          })
        );
      }

      let resolved = false;

      return new Promise<T[]>((resolve) => {
        unsubscribe.current = onSnapshot(
          _query,
          {
            includeMetadataChanges: options?.includeMetadataChanges,
          },
          (snapshot) => {
            if (!resolved) {
              resolved = true;
              return resolve(
                snapshot.docs.map((doc) =>
                  doc.data({
                    serverTimestamps: options?.serverTimestamps,
                  })
                )
              );
            } else {
              client.setQueryData<T[]>(
                key,
                snapshot.docs.map((doc) =>
                  doc.data({
                    serverTimestamps: options?.serverTimestamps,
                  })
                )
              );
            }
          }
        );
      });
    },
  });
}

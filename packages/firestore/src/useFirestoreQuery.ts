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

import { useCallback, useEffect, useRef, useState } from "react";
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
  queryEqual,
  Unsubscribe,
  QuerySnapshot,
  getDocsFromCache,
  getDocsFromServer,
  namedQuery as firestoreNamedQuery,
  DocumentData,
  Firestore,
  SnapshotOptions,
} from "firebase/firestore";
import { usePrevious } from "./usePrevious";
import { GetSnapshotSource, UseFirestoreHookOptions } from "./index";
import { getClientKey } from "./utils";

const namedQueryCache: { [key: string]: Query } = {};

type NamedQueryPromise<T> = () => Promise<Query<T> | null>;

type NamedQuery<T> = Query<T> | NamedQueryPromise<T>;

type QueryType<T> = Query<T> | NamedQuery<T>;

function isNamedQuery<T>(query: QueryType<T>): query is NamedQuery<T> {
  return typeof query === "function";
}

function useQueryResolver<T>(
  enabled: boolean,
  query: QueryType<T>,
  includeMetadataChanges: boolean | undefined,
  onSnapshotEvent: (snapshot: QuerySnapshot<T>) => void
): Query<T> | null {
  // Separate the query and named query types.
  let queryFn: Query<T> | undefined;
  let namedQueryFn: NamedQueryPromise<T> | undefined;

  // If the user passed a named query function.
  if (isNamedQuery(query)) {
    // Check whether result is a promise or query.
    if (typeof query === "function") {
      namedQueryFn = query;
    } else {
      queryFn = query;
    }
  } else {
    queryFn = query;
  }

  const previousQuery = usePrevious(queryFn);
  const isEqual = !!previousQuery && queryEqual(previousQuery, queryFn!);
  const [resolvedQuery, setResolvedQuery] = useState<Query<T> | null>(null);
  const unsubscribe = useRef<Unsubscribe>();

  // Anytime the query changes, update the resolved query.
  useEffect(() => {
    if (!isEqual && !!queryFn) {
      setResolvedQuery(queryFn);
    }
  }, [isEqual, queryFn]);

  // If a named query is provided, resolve it.
  useEffect(() => {
    if (!resolvedQuery && !!namedQueryFn) {
      namedQueryFn().then(setResolvedQuery);
    }
  }, [resolvedQuery, namedQueryFn]);

  // Subscribes to the resolved query.
  useEffect(() => {
    if (enabled && resolvedQuery) {
      unsubscribe.current = onSnapshot(
        resolvedQuery,
        {
          includeMetadataChanges,
        },
        onSnapshotEvent
      );
    }
  }, [enabled, resolvedQuery, includeMetadataChanges, onSnapshotEvent]);

  // Unsubscribes the query subscription when the query changes.
  useEffect(() => {
    if (!isEqual && !!previousQuery) {
      return () => {
        unsubscribe.current?.();
      };
    }
  }, [unsubscribe, isEqual, previousQuery]);

  useEffect(() => {
    return () => {
      unsubscribe.current?.();
    };
  }, []);

  return resolvedQuery;
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
  useQueryOptions?: UseQueryOptions<QuerySnapshot<T>, Error, R>
) {
  const client = useQueryClient();
  const subscribe = options?.subscribe ?? false;
  const enabled = useQueryOptions?.enabled ?? true;
  const includeMetadataChanges = options?.subscribe
    ? options?.includeMetadataChanges ?? undefined
    : undefined;

  const compareKey = getClientKey(key);

  const onSnapshotEvent = useCallback(
    (snapshot: QuerySnapshot<T>) => {
      client.setQueryData<QuerySnapshot<T>>(key, snapshot);
    },
    [compareKey]
  );

  const resolvedQuery = useQueryResolver(
    subscribe && enabled,
    query,
    includeMetadataChanges,
    onSnapshotEvent
  );

  return useQuery<QuerySnapshot<T>, Error, R>(
    key,
    () => getSnapshot(resolvedQuery!, options?.source),
    {
      ...(useQueryOptions || {}),
      // If there is a resolved query, use the users option (or default), otherwise it is false.
      enabled: !!resolvedQuery ? useQueryOptions?.enabled ?? undefined : false,
    }
  );
}

export function useFirestoreQueryData<T = DocumentData, R = T>(
  key: QueryKey,
  query: QueryType<T>,
  options?: UseFirestoreHookOptions & SnapshotOptions,
  useQueryOptions?: UseQueryOptions<T[], Error, R>
) {
  const client = useQueryClient();
  const subscribe = options?.subscribe ?? false;
  const enabled = useQueryOptions?.enabled ?? true;
  const includeMetadataChanges = options?.subscribe
    ? options?.includeMetadataChanges ?? undefined
    : undefined;

  const compareKey = getClientKey(key);

  const onSnapshotEvent = useCallback(
    (snapshot: QuerySnapshot<T>) => {
      client.setQueryData<T[]>(
        key,
        snapshot.docs.map((doc) =>
          doc.data({
            serverTimestamps: options?.serverTimestamps,
          })
        )
      );
    },
    [compareKey]
  );

  const resolvedQuery = useQueryResolver(
    subscribe && enabled,
    query,
    includeMetadataChanges,
    onSnapshotEvent
  );

  return useQuery<T[], Error, R>(
    key,
    async () => {
      const snapshot = await getSnapshot(resolvedQuery!, options?.source);

      return snapshot.docs.map((doc) =>
        doc.data({
          serverTimestamps: options?.serverTimestamps,
        })
      );
    },
    {
      ...(useQueryOptions || {}),
      // If there is a resolved query, use the users option (or default), otherwise it is false.
      enabled: !!resolvedQuery ? useQueryOptions?.enabled ?? undefined : false,
    }
  );
}

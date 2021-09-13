import { useEffect, useRef, useState } from "react";
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
import { UseFirestoreHookOptions } from "./index";

const namedQueryCache: { [key: string]: Query } = {};

type NamedQueryPromise<T> = () => Promise<Query<T> | null>;

type NamedQuery<T> = Query<T> | NamedQueryPromise<T>;

type QueryType<T> = Query<T> | NamedQuery<T>;

function isNamedQuery<T>(query: QueryType<T>): query is NamedQuery<T> {
  return typeof query === "function";
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

  const enabled = useQueryOptions?.enabled ?? true;
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
    if (enabled && resolvedQuery && subscribe) {
      unsubscribe.current = onSnapshot(
        resolvedQuery,
        {
          includeMetadataChanges: options?.subscribe
            ? options?.includeMetadataChanges ?? undefined
            : undefined,
        },
        (snapshot) => {
          client.setQueryData<QuerySnapshot<T>>(key, snapshot);
        }
      );
    }
  }, [enabled, resolvedQuery, subscribe]);

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

  return useQuery<QuerySnapshot<T>, Error, R>(
    key,
    async () => {
      let snapshot: QuerySnapshot<T>;

      if (options?.source === "cache") {
        snapshot = await getDocsFromCache(resolvedQuery!);
      } else if (options?.source === "server") {
        snapshot = await getDocsFromServer(resolvedQuery!);
      } else {
        snapshot = await getDocs(resolvedQuery!);
      }

      return snapshot;
    },
    {
      ...(useQueryOptions || {}),
      // If there is a resolved query, use the users option (or default), otherwise it is false.
      enabled: !!resolvedQuery ? useQueryOptions?.enabled ?? undefined : false,
    }
  );
}

export function useFirestoreQueryData<T = DocumentData>(
  key: QueryKey,
  query: QueryType<T>,
  options?: UseFirestoreHookOptions & SnapshotOptions,
  useQueryOptions?: UseQueryOptions<QuerySnapshot<T>, Error, T[]>
) {
  const { select, ...queryOptions } = useQueryOptions || {};

  return useFirestoreQuery<T, T[]>(key, query, options, {
    ...queryOptions,
    select(snapshot) {
      return (
        select?.(snapshot) ??
        snapshot.docs.map((doc) =>
          doc.data({ serverTimestamps: options?.serverTimestamps })
        )
      );
    },
  });
}

import { useEffect, useRef } from "react";
import {
  useQuery,
  useQueryClient,
  QueryKey,
  UseQueryResult,
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
} from "firebase/firestore";
import { usePrevious } from "./usePrevious";
import { UseFirestoreHookOptions } from "./index";

type ResultType<T> = QuerySnapshot<T>;

export function useFirestoreQuery<T>(
  key: QueryKey,
  query: Query<T>,
  options?: UseFirestoreHookOptions,
  useQueryOptions?: UseQueryOptions<ResultType<T>, Error>
): UseQueryResult<ResultType<T>, Error> {
  const client = useQueryClient();
  const subscribe = options?.subscribe ?? false;
  const previousQuery = usePrevious(query);
  const isEqual = !!previousQuery && queryEqual(previousQuery, query);
  const unsubscribe = useRef<Unsubscribe>();

  // Subscribes to the query (if enabled) and and if the query has changed new.
  useEffect(() => {
    if (subscribe && !isEqual) {
      unsubscribe.current = onSnapshot(
        query,
        {
          includeMetadataChanges: options?.subscribe
            ? options?.includeMetadataChanges ?? undefined
            : undefined,
        },
        (snapshot) => {
          client.setQueryData<ResultType<T>>(key, snapshot);
        }
      );
    }
  }, [subscribe, isEqual, query]);

  // Unsubscribes the query subscription when the query changes.
  useEffect(() => {
    if (!isEqual && !!previousQuery) {
      return () => {
        unsubscribe.current?.();
      };
    }
  }, [unsubscribe, isEqual, previousQuery]);

  return useQuery<ResultType<T>, Error>(
    key,
    async () => {
      let snapshot: QuerySnapshot<T>;

      if (options.source === "cache") {
        snapshot = await getDocsFromCache(query);
      } else if (options.source === "server") {
        snapshot = await getDocsFromServer(query);
      } else {
        snapshot = await getDocs(query);
      }

      return snapshot;
    },
    useQueryOptions
  );
}

import { useEffect, useRef } from "react";
import {
  useQuery,
  useQueryClient,
  QueryKey,
  UseQueryResult,
  UseQueryOptions,
} from "react-query";
import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  getDocFromCache,
  getDocFromServer,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { usePrevious } from "./usePrevious";
import { UseFirestoreHookOptions } from "./index";

type ResultType<T> = DocumentSnapshot<T>;

export function useFirestoreDocument<T = DocumentData>(
  key: QueryKey,
  ref: DocumentReference<T>,
  options?: UseFirestoreHookOptions,
  useQueryOptions?: UseQueryOptions<ResultType<T>, Error>
): UseQueryResult<ResultType<T>, Error> {
  const client = useQueryClient();
  const { subscribe } = options || {};

  const previousRef = usePrevious(ref);
  const isEqual = !!previousRef && ref.id === previousRef.id;
  const unsubscribe = useRef<Unsubscribe>();

  // Subscribes to the ref (if enabled) and and if the ref has changed.
  useEffect(() => {
    if (subscribe && !isEqual) {
      unsubscribe.current = onSnapshot(
        ref,
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
  }, [subscribe, isEqual, ref]);

  // Unsubscribes the ref subscription when the ref changes.
  useEffect(() => {
    if (!isEqual && !!previousRef) {
      return () => {
        unsubscribe.current?.();
      };
    }
  }, [unsubscribe, isEqual, previousRef]);

  return useQuery<ResultType<T>, Error>(
    key,
    async () => {
      let snapshot: DocumentSnapshot<T>;

      if (options.source === "cache") {
        snapshot = await getDocFromCache(ref);
      } else if (options.source === "server") {
        snapshot = await getDocFromServer(ref);
      } else {
        snapshot = await getDoc(ref);
      }

      return snapshot;
    },
    useQueryOptions
  );
}

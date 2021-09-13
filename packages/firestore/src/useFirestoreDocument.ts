import { useEffect, useRef } from "react";
import {
  useQuery,
  useQueryClient,
  QueryKey,
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
  SnapshotOptions,
  Unsubscribe,
} from "firebase/firestore";
import { usePrevious } from "./usePrevious";
import { UseFirestoreHookOptions } from "./index";

export function useFirestoreDocument<T = DocumentData, R = DocumentSnapshot<T>>(
  key: QueryKey,
  ref: DocumentReference<T>,
  options?: UseFirestoreHookOptions,
  useQueryOptions?: UseQueryOptions<DocumentSnapshot<T>, Error, R>
) {
  const client = useQueryClient();
  const subscribe = options?.subscribe ?? false;

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
          client.setQueryData<DocumentSnapshot<T>>(key, snapshot);
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

  // Unsubscribe when the hook is no longer in use.
  useEffect(() => {
    return () => {
      unsubscribe.current?.();
    };
  }, []);

  return useQuery<DocumentSnapshot<T>, Error, R>(
    key,
    async () => {
      let snapshot: DocumentSnapshot<T>;

      if (options?.source === "cache") {
        snapshot = await getDocFromCache(ref);
      } else if (options?.source === "server") {
        snapshot = await getDocFromServer(ref);
      } else {
        snapshot = await getDoc(ref);
      }

      return snapshot;
    },
    useQueryOptions
  );
}

export function useFirestoreDocumentData<T = DocumentData>(
  key: QueryKey,
  ref: DocumentReference<T>,
  options?: UseFirestoreHookOptions & SnapshotOptions,
  useQueryOptions?: UseQueryOptions<DocumentSnapshot<T>, Error, T | undefined>
) {
  const { select, ...queryOptions } = useQueryOptions || {};

  return useFirestoreDocument<T, T | undefined>(key, ref, options, {
    ...queryOptions,
    select(snapshot) {
      return (
        select?.(snapshot) ??
        snapshot.data({ serverTimestamps: options?.serverTimestamps })
      );
    },
  });
}

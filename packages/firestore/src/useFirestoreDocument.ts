import { useCallback, useEffect, useRef } from "react";
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
import { GetSnapshotSource, UseFirestoreHookOptions } from "./index";

function useSubscription<T>(
  enabled: boolean,
  ref: DocumentReference<T>,
  includeMetadataChanges: boolean | undefined,
  onSnapshotEvent: (snapshot: DocumentSnapshot<T>) => void
): void {
  const previousRef = usePrevious(ref);
  const isEqual = !!previousRef && ref.id === previousRef.id;
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    if (enabled && !isEqual) {
      unsubscribe.current = onSnapshot(
        ref,
        {
          includeMetadataChanges,
        },
        onSnapshotEvent
      );
    }
  }, [enabled, isEqual, ref, includeMetadataChanges, onSnapshotEvent]);

  // Unsubscribes the ref subscription when the ref changes.
  useEffect(() => {
    if (!isEqual && !!previousRef) {
      return () => {
        unsubscribe.current?.();
      };
    }
  }, [isEqual, previousRef]);

  // Unsubscribe when the hook is no longer in use.
  useEffect(() => {
    return () => {
      unsubscribe.current?.();
    };
  }, []);
}

async function getSnapshot<T>(
  ref: DocumentReference<T>,
  source?: GetSnapshotSource
): Promise<DocumentSnapshot<T>> {
  let snapshot: DocumentSnapshot<T>;

  if (source === "cache") {
    snapshot = await getDocFromCache(ref);
  } else if (source === "server") {
    snapshot = await getDocFromServer(ref);
  } else {
    snapshot = await getDoc(ref);
  }

  return snapshot;
}

export function useFirestoreDocument<T = DocumentData, R = DocumentSnapshot<T>>(
  key: QueryKey,
  ref: DocumentReference<T>,
  options?: UseFirestoreHookOptions,
  useQueryOptions?: UseQueryOptions<DocumentSnapshot<T>, Error, R>
) {
  const client = useQueryClient();
  const subscribe = options?.subscribe ?? false;
  const enabled = useQueryOptions?.enabled ?? true;
  const includeMetadataChanges = options?.subscribe
    ? options?.includeMetadataChanges ?? undefined
    : undefined;

  const onSnapshotEvent = useCallback(
    (snapshot: DocumentSnapshot<T>) => {
      client.setQueryData<DocumentSnapshot<T>>(key, snapshot);
    },
    [key]
  );

  useSubscription<T>(
    subscribe && enabled,
    ref,
    includeMetadataChanges,
    onSnapshotEvent
  );

  return useQuery<DocumentSnapshot<T>, Error, R>(
    key,
    () => getSnapshot(ref, options?.source),
    useQueryOptions
  );
}

export function useFirestoreDocumentData<T = DocumentData>(
  key: QueryKey,
  ref: DocumentReference<T>,
  options?: UseFirestoreHookOptions & SnapshotOptions,
  useQueryOptions?: UseQueryOptions<T | undefined, Error>
) {
  const client = useQueryClient();
  const subscribe = options?.subscribe ?? false;
  const enabled = useQueryOptions?.enabled ?? true;
  const includeMetadataChanges = options?.subscribe
    ? options?.includeMetadataChanges ?? undefined
    : undefined;

  const onSnapshotEvent = useCallback(
    (snapshot: DocumentSnapshot<T>) => {
      client.setQueryData<T | undefined>(
        key,
        snapshot.data({
          serverTimestamps: options?.serverTimestamps,
        })
      );
    },
    [key]
  );

  useSubscription<T>(
    subscribe && enabled,
    ref,
    includeMetadataChanges,
    onSnapshotEvent
  );

  return useQuery<T | undefined, Error>(
    key,
    async () => {
      const snapshot = await getSnapshot(ref, options?.source);

      return snapshot.data({
        serverTimestamps: options?.serverTimestamps,
      });
    },
    useQueryOptions
  );
}

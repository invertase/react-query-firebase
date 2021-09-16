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
import { getClientKey } from "./utils";

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

  const compareKey = getClientKey(key);

  const onSnapshotEvent = useCallback(
    (snapshot: DocumentSnapshot<T>) => {
      client.setQueryData<DocumentSnapshot<T>>(key, snapshot);
    },
    [compareKey]
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

export function useFirestoreDocumentData<T = DocumentData, R = T>(
  key: QueryKey,
  ref: DocumentReference<T>,
  options?: UseFirestoreHookOptions & SnapshotOptions,
  useQueryOptions?: UseQueryOptions<T | undefined, Error, R>
) {
  const client = useQueryClient();
  const subscribe = options?.subscribe ?? false;
  const enabled = useQueryOptions?.enabled ?? true;
  const includeMetadataChanges = options?.subscribe
    ? options?.includeMetadataChanges ?? undefined
    : undefined;

  const compareKey = getClientKey(key);

  const onSnapshotEvent = useCallback(
    (snapshot: DocumentSnapshot<T>) => {
      client.setQueryData<T | undefined>(
        key,
        snapshot.data({
          serverTimestamps: options?.serverTimestamps,
        })
      );
    },
    [compareKey]
  );

  useSubscription<T>(
    subscribe && enabled,
    ref,
    includeMetadataChanges,
    onSnapshotEvent
  );

  return useQuery<T | undefined, Error, R>(
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

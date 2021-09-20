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
import { GetSnapshotSource, UseFirestoreHookOptions } from "./index";

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
  useQueryOptions?: Omit<
    UseQueryOptions<DocumentSnapshot<T>, Error, R>,
    "queryFn"
  >
) {
  const client = useQueryClient();
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    return () => unsubscribe.current?.();
  }, []);

  return useQuery<DocumentSnapshot<T>, Error, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      unsubscribe.current?.();

      if (!options?.subscribe) {
        return getSnapshot(ref, options?.source);
      }

      let resolved = false;

      return new Promise<DocumentSnapshot<T>>((resolve, reject) => {
        unsubscribe.current = onSnapshot(
          ref,
          {
            includeMetadataChanges: options?.includeMetadataChanges,
          },
          (snapshot) => {
            if (!resolved) {
              resolved = true;
              return resolve(snapshot);
            } else {
              client.setQueryData<DocumentSnapshot<T>>(key, snapshot);
            }
          },
          reject
        );
      });
    },
  });
}

export function useFirestoreDocumentData<T = DocumentData, R = T>(
  key: QueryKey,
  ref: DocumentReference<T>,
  options?: UseFirestoreHookOptions & SnapshotOptions,
  useQueryOptions?: Omit<UseQueryOptions<T | undefined, Error, R>, "queryFn">
) {
  const client = useQueryClient();
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    return () => unsubscribe.current?.();
  }, []);

  return useQuery<T | undefined, Error, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      unsubscribe.current?.();

      if (!options?.subscribe) {
        const snapshot = await getSnapshot(ref, options?.source);

        return snapshot.data({
          serverTimestamps: options?.serverTimestamps,
        });
      }

      let resolved = false;

      return new Promise<T | undefined>((resolve, reject) => {
        unsubscribe.current = onSnapshot(
          ref,
          {
            includeMetadataChanges: options?.includeMetadataChanges,
          },
          (snapshot) => {
            if (!resolved) {
              resolved = true;
              return resolve(
                snapshot.data({
                  serverTimestamps: options?.serverTimestamps,
                })
              );
            } else {
              client.setQueryData<T | undefined>(
                key,
                snapshot.data({
                  serverTimestamps: options?.serverTimestamps,
                })
              );
            }
          },
          reject
        );
      });
    },
  });
}

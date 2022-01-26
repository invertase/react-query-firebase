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
  UseQueryResult,
  hashQueryKey,
} from "react-query";
import {
  DocumentData,
  DocumentReference,
  FirestoreError,
  onSnapshot,
  SnapshotOptions,
  Unsubscribe,
} from "firebase/firestore";
import { UseFirestoreHookOptions, WithIdField, getSnapshot } from "./index";
import { Completer } from "../../utils/src";

const counts: { [key: string]: number } = {};
const subscriptions: { [key: string]: Unsubscribe } = {};

export function useFirestoreDocumentData<
  T = DocumentData,
  R = WithIdField<T> | undefined
>(
  key: QueryKey,
  ref: DocumentReference<T>,
  options?: UseFirestoreHookOptions & SnapshotOptions,
  useQueryOptions?: Omit<
    UseQueryOptions<WithIdField<T> | undefined, FirestoreError, R>,
    "queryFn"
  >
): UseQueryResult<R, FirestoreError>;

export function useFirestoreDocumentData<
  ID extends string,
  T = DocumentData,
  R = WithIdField<T, ID> | undefined
>(
  key: QueryKey,
  ref: DocumentReference<T>,
  options?: UseFirestoreHookOptions & SnapshotOptions & { idField: ID },
  useQueryOptions?: Omit<
    UseQueryOptions<WithIdField<T, ID> | undefined, FirestoreError, R>,
    "queryFn"
  >
): UseQueryResult<R | undefined, FirestoreError>;

export function useFirestoreDocumentData<
  ID extends string,
  T = DocumentData,
  R = WithIdField<T, ID> | undefined
>(
  key: QueryKey,
  ref: DocumentReference<T>,
  options?: UseFirestoreHookOptions & SnapshotOptions & { idField?: ID },
  useQueryOptions?: Omit<
    UseQueryOptions<WithIdField<T, ID> | undefined, FirestoreError, R>,
    "queryFn"
  >
): UseQueryResult<R, FirestoreError> {
  const client = useQueryClient();
  const completer = useRef<Completer<WithIdField<T, ID> | undefined>>(
    new Completer()
  );

  const hashFn = useQueryOptions?.queryKeyHashFn || hashQueryKey;
  const hash = hashFn(key);

  const isSubscription = !!options?.subscribe;

  useEffect(() => {
    if (!isSubscription) {
      getSnapshot(ref, options?.source)
        .then((snapshot) => {
          let data = snapshot.data({
            serverTimestamps: options?.serverTimestamps,
          });

          if (data && options?.idField) {
            data = {
              ...data,
              [options.idField]: snapshot.id,
            };
          }

          completer.current!.complete(data as WithIdField<T, ID> | undefined);
        })
        .catch((error) => {
          completer.current!.reject(error);
        });
    }
  }, [isSubscription, hash, completer]);

  useEffect(() => {
    if (isSubscription) {
      counts[hash] ??= 0;
      counts[hash]++;

      // If there is only one instance of this query key, subscribe
      if (counts[hash] === 1) {
        subscriptions[hash] = onSnapshot(
          ref,
          {
            includeMetadataChanges: options?.includeMetadataChanges,
          },
          (snapshot) => {
            let data = snapshot.data({
              serverTimestamps: options?.serverTimestamps,
            });

            if (data && options?.idField) {
              data = {
                ...data,
                [options.idField]: snapshot.id,
              };
            }

            // Cannot figure out how to get this working without a cast!
            const _dataWithIdField = data as WithIdField<T, ID> | undefined;

            // Set the data each time state changes.
            client.setQueryData<WithIdField<T, ID> | undefined>(
              key,
              _dataWithIdField
            );

            // Resolve the completer with the current data.
            if (!completer.current!.completed) {
              completer.current!.complete(_dataWithIdField);
            }
          },
          (error) => completer.current!.reject(error)
        );
      } else {
        // Since there is already an active subscription, resolve the completer
        // with the cached data.
        completer.current!.complete(
          client.getQueryData(key) as WithIdField<T, ID> | undefined
        );
      }

      return () => {
        counts[hash]--;

        if (counts[hash] === 0) {
          subscriptions[hash]();
          delete subscriptions[hash];
        }
      };
    }
  }, [isSubscription, hash, completer]);

  return useQuery<WithIdField<T, ID> | undefined, FirestoreError, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    queryFn: () => completer.current!.promise,
  });
}

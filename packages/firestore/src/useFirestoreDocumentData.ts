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

import { useCallback } from "react";
import { QueryKey, UseQueryOptions, UseQueryResult } from "react-query";
import {
  DocumentData,
  DocumentReference,
  FirestoreError,
  onSnapshot,
  SnapshotOptions,
} from "firebase/firestore";
import {
  UseFirestoreHookOptions,
  WithIdField,
  getSnapshot,
  GetSnapshotSource,
} from "./index";
import { useSubscription } from "../../utils/src/useSubscription";

type NextOrObserver<T, ID> = (
  data: WithIdField<T, ID> | undefined
) => Promise<void>;

export function useFirestoreDocumentData<
  T = DocumentData,
  R = WithIdField<T> | undefined
>(
  key: QueryKey,
  ref?: DocumentReference<T>,
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
  ref?: DocumentReference<T>,
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
  queryKey: QueryKey,
  ref?: DocumentReference<T>,
  options?: UseFirestoreHookOptions & SnapshotOptions & { idField?: ID },
  useQueryOptions?: Omit<
    UseQueryOptions<WithIdField<T, ID> | undefined, FirestoreError, R>,
    "queryFn"
  >
): UseQueryResult<R, FirestoreError> {
  const isSubscription = !!options?.subscribe;

  let source: GetSnapshotSource | undefined;
  let includeMetadataChanges: boolean | undefined;

  if (options?.subscribe === undefined) {
    source = options?.source;
  }
  if (options?.subscribe) {
    includeMetadataChanges = options.includeMetadataChanges;
  }

  const subscribeFn = useCallback(
    (callback: NextOrObserver<T, ID>) => {
      let unsubscribe = () => {
        // noop
      };
      if (ref) {
        unsubscribe = onSnapshot(
          ref,
          {
            includeMetadataChanges,
          },
          (snapshot: DocumentData) => {
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

            callback(_dataWithIdField);
          }
        );
      }
      return unsubscribe;
    },
    [ref]
  );

  const fetchFn = async () => {
    if (!ref) {
      return null;
    }

    return getSnapshot(ref, source).then((snapshot) => {
      let data = snapshot.data({
        serverTimestamps: options?.serverTimestamps,
      });

      if (data && options?.idField) {
        data = {
          ...data,
          [options.idField]: snapshot.id,
        };
      }
      return data as WithIdField<T, ID> | undefined;
    });
  };

  return useSubscription<WithIdField<T, ID> | undefined, FirestoreError, R>(
    queryKey,
    ["useFirestoreDocument", queryKey],
    subscribeFn,
    {
      ...useQueryOptions,
      onlyOnce: !isSubscription,
      fetchFn,
    }
  );
}

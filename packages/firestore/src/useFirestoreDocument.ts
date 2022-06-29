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
import { QueryKey, UseQueryOptions, UseQueryResult } from "react-query";
import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  onSnapshot,
  FirestoreError,
} from "firebase/firestore";
import {
  getSnapshot,
  GetSnapshotSource,
  UseFirestoreHookOptions,
} from "./index";
import { useSubscription } from "../../utils/src/useSubscription";
import { useCallback } from "react";

type NextOrObserver<T> = (data: DocumentSnapshot<T> | null) => Promise<void>;

export function useFirestoreDocument<T = DocumentData, R = DocumentSnapshot<T>>(
  queryKey: QueryKey,
  ref?: DocumentReference<T>,
  options?: UseFirestoreHookOptions,
  useQueryOptions?: Omit<
    UseQueryOptions<DocumentSnapshot<T>, FirestoreError, R>,
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
    (callback: NextOrObserver<T>) => {
      let unsubscribe = () => {
        // noop
      };
      if (ref) {
        unsubscribe = onSnapshot(
          ref,
          {
            includeMetadataChanges,
          },
          (snapshot: DocumentSnapshot<T>) => {
            // Set the data each time state changes.
            return callback(snapshot);
          }
        );
      }
      return unsubscribe;
    },
    [ref]
  );

  return useSubscription<DocumentSnapshot<T>, FirestoreError, R>(
    queryKey,
    ["useFirestoreDocument", queryKey],
    subscribeFn,
    {
      ...useQueryOptions,
      onlyOnce: !isSubscription,
      fetchFn: async () => (ref ? getSnapshot(ref, source) : null),
    }
  );
}

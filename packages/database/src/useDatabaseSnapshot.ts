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
import { DatabaseReference, onValue, DataSnapshot } from "firebase/database";
import { useCallback } from "react";
import { useSubscription } from "../../utils/src/useSubscription";
import { get } from "firebase/database";

type NextOrObserver = (data: DataSnapshot) => Promise<void>;

export function useDatabaseSnapshot<R = DataSnapshot>(
  queryKey: QueryKey,
  ref: DatabaseReference,
  options: { subscribe?: boolean } = {},
  useQueryOptions?: Omit<UseQueryOptions<DataSnapshot, Error, R>, "queryFn">
): UseQueryResult<R, Error> {
  const isSubscription = !!options.subscribe;

  const subscribeFn = useCallback(
    (callback: NextOrObserver) => {
      return onValue(ref, (snapshot) => {
        return callback(snapshot);
      });
    },
    [ref]
  );

  return useSubscription<DataSnapshot, Error, R>(
    queryKey,
    ["useDatabaseSnapshot", queryKey],
    subscribeFn,
    {
      ...useQueryOptions,
      onlyOnce: !isSubscription,
      fetchFn: async () => get(ref),
    }
  );
}

function parseDataSnapshot(snapshot: DataSnapshot, toArray: boolean): any {
  if (!snapshot.exists()) {
    return null;
  }

  if (snapshot.hasChildren() && toArray) {
    const array: unknown[] = [];
    snapshot.forEach((snapshot) => {
      array.push(parseDataSnapshot(snapshot, toArray));
    });
    return array;
  }

  return snapshot.val();
}

export type UseDatabaseValueOptions = {
  subscribe?: boolean;
  toArray?: boolean;
};

export function useDatabaseValue<T = unknown | null, R = T>(
  queryKey: QueryKey,
  ref: DatabaseReference,
  options: UseDatabaseValueOptions = {},
  useQueryOptions?: Omit<UseQueryOptions<T, Error, R>, "queryFn">
): UseQueryResult<R, Error> {
  const isSubscription = !!options?.subscribe;

  const subscribeFn = useCallback(
    (callback: (data: T) => Promise<void>) => {
      return onValue(ref, (snapshot) => {
        const data = parseDataSnapshot(snapshot, !!options?.toArray);
        return callback(data);
      });
    },
    [ref]
  );

  return useSubscription<T, Error, R>(
    queryKey,
    ["useDatabaseValue", queryKey],
    subscribeFn,
    {
      ...useQueryOptions,
      onlyOnce: !isSubscription,
      fetchFn: async () =>
        parseDataSnapshot(await get(ref), !!options?.toArray),
    }
  );
}

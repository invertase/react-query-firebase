import {
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import {
  DatabaseReference,
  Unsubscribe,
  onValue,
  DataSnapshot,
} from "firebase/database";
import { useCallback, useEffect, useRef } from "react";
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
    ["useFirestoreDatabase", ref.key],
    subscribeFn,
    useQueryOptions,
    !isSubscription,
    async () => get(ref)
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
  key: QueryKey,
  ref: DatabaseReference,
  options: UseDatabaseValueOptions = {},
  useQueryOptions?: Omit<UseQueryOptions<T, Error, R>, "queryFn">
): UseQueryResult<R, Error> {
  const client = useQueryClient();
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    return () => {
      unsubscribe.current?.();
    };
  }, []);

  return useQuery<T, Error, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    staleTime:
      useQueryOptions?.staleTime ?? options?.subscribe ? Infinity : undefined,
    async queryFn() {
      unsubscribe.current?.();
      let resolved = false;

      return new Promise<T>((resolve, reject) => {
        unsubscribe.current = onValue(
          ref,
          (snapshot) => {
            if (!resolved) {
              resolved = true;
              return resolve(parseDataSnapshot(snapshot, !!options?.toArray));
            } else {
              client.setQueryData<T>(
                key,
                parseDataSnapshot(snapshot, !!options?.toArray)
              );
            }
          },
          reject,
          {
            onlyOnce: !options.subscribe,
          }
        );
      });
    },
  });
}

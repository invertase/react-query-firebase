import {
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import {
  FirebaseDatabaseTypes
} from "@react-native-firebase/database";
import { useEffect, useRef } from "react";

export function useDatabaseSnapshot<R = FirebaseDatabaseTypes.DataSnapshot>(
  key: QueryKey,
  ref: FirebaseDatabaseTypes.Reference,
  options: { subscribe?: boolean } = {},
  useQueryOptions?: Omit<UseQueryOptions<FirebaseDatabaseTypes.DataSnapshot, Error, R>, "queryFn">
): UseQueryResult<R, Error> {
  const client = useQueryClient();
  const unsubscribe = useRef<any>();

  useEffect(() => {
    return () => {
      if (options.subscribe) ref.off(unsubscribe.current?.());
    };
  }, []);

  return useQuery<FirebaseDatabaseTypes.DataSnapshot, Error, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    staleTime:
      useQueryOptions?.staleTime ?? options?.subscribe ? Infinity : undefined,
    async queryFn() {
      if (options.subscribe) ref.off(unsubscribe.current?.());
      let resolved = false;

      return new Promise<FirebaseDatabaseTypes.DataSnapshot>((resolve, reject) => {
        unsubscribe.current = ref[options.subscribe ? "on" : "once"]("value", (snapshot) => {
          if (!resolved) {
            resolved = true;
            return resolve(snapshot);
          } else {
            client.setQueryData<FirebaseDatabaseTypes.DataSnapshot>(key, snapshot);
          }
        },
        reject);
      });
    },
  });
}

function parseDataSnapshot(snapshot: FirebaseDatabaseTypes.DataSnapshot, toArray: boolean): any {
  if (!snapshot.exists()) {
    return null;
  }

  if (snapshot.hasChildren() && toArray) {
    const array: unknown[] = [];
    snapshot.forEach((snapshot) => {
      array.push(parseDataSnapshot(snapshot, toArray));
      return true;
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
  ref: FirebaseDatabaseTypes.Reference,
  options: UseDatabaseValueOptions = {},
  useQueryOptions?: Omit<UseQueryOptions<T, Error, R>, "queryFn">
): UseQueryResult<R, Error> {
  const client = useQueryClient();
  const unsubscribe = useRef<any>();

  useEffect(() => {
    return () => {
      if (options.subscribe) ref.off(unsubscribe.current?.());
    };
  }, []);

  return useQuery<T, Error, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    staleTime:
      useQueryOptions?.staleTime ?? options?.subscribe ? Infinity : undefined,
    async queryFn() {
      if (options.subscribe) ref.off(unsubscribe.current?.());
      let resolved = false;

      return new Promise<T>((resolve, reject) => {
        unsubscribe.current = ref[options.subscribe ? "on" : "once"]("value",
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
        );
      });
    },
  });
}

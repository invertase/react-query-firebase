import {
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "react-query";
import {
  DatabaseReference,
  Unsubscribe,
  onValue,
  DataSnapshot,
} from "firebase/database";
import { useEffect, useRef } from "react";

export function useDatabaseSnapshot(
  key: QueryKey,
  ref: DatabaseReference,
  options: { subscribe?: boolean } = {},
  useQueryOptions?: Omit<UseQueryOptions<DataSnapshot, Error, void>, "queryFn">
) {
  const client = useQueryClient();
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    return () => {
      unsubscribe.current?.();
    };
  }, []);

  return useQuery<DataSnapshot, Error, void>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      unsubscribe.current?.();

      if (!options.subscribe) {
        return new Promise<DataSnapshot>((resolve, reject) => {
          onValue(ref, resolve, reject, {
            onlyOnce: true,
          });
        });
      }

      let resolved = false;

      return new Promise<DataSnapshot>((resolve, reject) => {
        unsubscribe.current = onValue(
          ref,
          (snapshot) => {
            if (!resolved) {
              resolved = true;
              return resolve(snapshot);
            } else {
              client.setQueryData<DataSnapshot>(key, snapshot);
            }
          },
          reject
        );
      });
    },
  });
}

function parseDataSnapshot(snapshot: DataSnapshot): any {
  if (!snapshot.exists()) {
    return null;
  }

  if (snapshot.hasChildren()) {
    const array: unknown[] = [];
    snapshot.forEach((snapshot) => {
      array.push(parseDataSnapshot(snapshot));
    });
    return array;
  }

  return snapshot.val();
}

export function useDatabaseValue<T = unknown>(
  key: QueryKey,
  ref: DatabaseReference,
  options: { subscribe?: boolean } = {},
  useQueryOptions?: Omit<UseQueryOptions<T, Error>, "queryFn">
) {
  const client = useQueryClient();
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    return () => {
      unsubscribe.current?.();
    };
  }, []);

  return useQuery<T, Error>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      unsubscribe.current?.();

      if (!options.subscribe) {
        return new Promise<T>((resolve, reject) => {
          onValue(
            ref,
            (snapshot) => resolve(parseDataSnapshot(snapshot)),
            reject,
            {
              onlyOnce: true,
            }
          );
        });
      }

      let resolved = false;

      return new Promise<T>((resolve, reject) => {
        unsubscribe.current = onValue(
          ref,
          (snapshot) => {
            if (!resolved) {
              resolved = true;
              return resolve(parseDataSnapshot(snapshot));
            } else {
              client.setQueryData<T>(key, parseDataSnapshot(snapshot));
            }
          },
          reject
        );
      });
    },
  });
}

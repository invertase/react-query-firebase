import { useEffect, useRef } from "react";
import {
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "react-query";
import { Auth, onIdTokenChanged, User, Unsubscribe } from "firebase/auth";

export function useAuthUser(
  key: QueryKey,
  auth: Auth,
  useQueryOptions?: Omit<UseQueryOptions<User | null, Error>, "queryFn">
) {
  const client = useQueryClient();
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    return () => {
      unsubscribe.current?.();
    };
  }, []);

  return useQuery<User | null, Error>({
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      unsubscribe.current?.();

      let resolved = false;

      return new Promise<User | null>((resolve) => {
        unsubscribe.current = onIdTokenChanged(auth, (user) => {
          if (!resolved) {
            resolved = true;
            resolve(user);
          } else {
            client.setQueryData<User | null>(key, user);
          }
        });
      });
    },
  });
}

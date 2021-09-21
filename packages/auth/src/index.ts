import { useEffect, useRef } from "react";
import {
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "react-query";
import {
  Auth,
  onIdTokenChanged,
  User,
  Unsubscribe,
  IdTokenResult,
  onAuthStateChanged,
} from "firebase/auth";

export function useAuthUser<R = User | null>(
  key: QueryKey,
  auth: Auth,
  useQueryOptions?: Omit<UseQueryOptions<User | null, Error, R>, "queryFn">
) {
  const client = useQueryClient();
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    return () => {
      unsubscribe.current?.();
    };
  }, []);

  return useQuery<User | null, Error, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      unsubscribe.current?.();

      let resolved = false;

      return new Promise<User | null>((resolve, reject) => {
        unsubscribe.current = onAuthStateChanged(
          auth,
          (user) => {
            if (!resolved) {
              resolved = true;
              resolve(user);
            } else {
              client.setQueryData<User | null>(key, user);
            }
          },
          reject
        );
      });
    },
  });
}

export function useAuthIdToken<R = IdTokenResult | null>(
  key: QueryKey,
  auth: Auth,
  options?: {
    forceRefresh?: boolean;
  },
  useQueryOptions?: Omit<
    UseQueryOptions<IdTokenResult | null, Error, R>,
    "queryFn"
  >
) {
  const client = useQueryClient();
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    return () => {
      unsubscribe.current?.();
    };
  }, []);

  return useQuery<IdTokenResult | null, Error, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      unsubscribe.current?.();

      let resolved = false;

      return new Promise<IdTokenResult | null>((resolve, reject) => {
        unsubscribe.current = onIdTokenChanged(
          auth,
          async (user) => {
            let token: IdTokenResult | null = null;

            if (user) {
              token = await user.getIdTokenResult(options?.forceRefresh);
            }

            if (!resolved) {
              resolved = true;
              resolve(token);
            } else {
              client.setQueryData<IdTokenResult | null>(key, token);
            }
          },
          reject
        );
      });
    },
  });
}

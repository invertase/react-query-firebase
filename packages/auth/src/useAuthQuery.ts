import { useEffect, useRef } from "react";
import {
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import {
  Auth,
  User,
  Unsubscribe,
  IdTokenResult,
  fetchSignInMethodsForEmail,
  AuthError,
  UserCredential,
  getRedirectResult,
  PopupRedirectResolver,
} from "firebase/auth";

export function useAuthUser<R = User | null>(
  key: QueryKey,
  auth: Auth,
  useQueryOptions?: Omit<UseQueryOptions<User | null, AuthError, R>, "queryFn">
): UseQueryResult<R, AuthError> {
  const client = useQueryClient();
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    return () => {
      unsubscribe.current?.();
    };
  }, []);

  return useQuery<User | null, AuthError, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    staleTime: useQueryOptions?.staleTime ?? Infinity,
    async queryFn() {
      unsubscribe.current?.();

      let resolved = false;

      return new Promise<User | null>((resolve, reject) => {
        unsubscribe.current = auth.onAuthStateChanged((user) => {
          if (!resolved) {
            resolved = true;
            resolve(user);
          } else {
            client.setQueryData<User | null>(key, user);
          }
        }, reject);
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
    UseQueryOptions<IdTokenResult | null, AuthError, R>,
    "queryFn"
  >
): UseQueryResult<R, AuthError> {
  const client = useQueryClient();
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    return () => {
      unsubscribe.current?.();
    };
  }, []);

  return useQuery<IdTokenResult | null, AuthError, R>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    staleTime: useQueryOptions?.staleTime ?? Infinity,
    async queryFn() {
      unsubscribe.current?.();

      let resolved = false;

      return new Promise<IdTokenResult | null>((resolve, reject) => {
        unsubscribe.current = auth.onIdTokenChanged(async (user) => {
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
        }, reject);
      });
    },
  });
}

export function useAuthGetRedirectResult(
  key: QueryKey,
  auth: Auth,
  resolver?: PopupRedirectResolver,
  useQueryOptions?: Omit<
    UseQueryOptions<UserCredential | null, AuthError>,
    "queryFn"
  >
): UseQueryResult<UserCredential | null, AuthError> {
  return useQuery<UserCredential | null, AuthError>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    staleTime: useQueryOptions?.staleTime ?? Infinity,
    async queryFn() {
      return getRedirectResult(auth, resolver);
    },
  });
}

export function useAuthFetchSignInMethodsForEmail(
  key: QueryKey,
  auth: Auth,
  email: string,
  useQueryOptions?: Omit<UseQueryOptions<string[], AuthError>, "queryFn">
): UseQueryResult<string[], AuthError> {
  return useQuery<string[], AuthError>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      return fetchSignInMethodsForEmail(auth, email);
    },
  });
}

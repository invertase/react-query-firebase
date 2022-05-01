import { useEffect, useRef } from "react";
import {
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";

import { FirebaseAuthTypes } from "@react-native-firebase/auth";
type User = FirebaseAuthTypes.User;
type Auth = FirebaseAuthTypes.Module;
type AuthError = FirebaseAuthTypes.NativeFirebaseAuthError;
type IdTokenResult = FirebaseAuthTypes.IdTokenResult;
type Unsubscribe = () => void;

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

      return new Promise<User | null>((resolve) => {
        unsubscribe.current = auth.onAuthStateChanged((user) => {
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

      return new Promise<IdTokenResult | null>((resolve) => {
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
        });
      });
    },
  });
}

// memo: getRedirectResult is not exists on React Native Firebase.
// export function useAuthGetRedirectResult;

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
      return auth.fetchSignInMethodsForEmail(email);
    },
  });
}

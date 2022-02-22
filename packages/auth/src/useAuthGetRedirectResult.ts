import {
  QueryKey,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import {
  Auth,
  AuthError,
  UserCredential,
  getRedirectResult,
  PopupRedirectResolver,
} from "firebase/auth";

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
    async queryFn() {
      return getRedirectResult(auth, resolver);
    },
  });
}

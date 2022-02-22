import {
  QueryKey,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import { Auth, fetchSignInMethodsForEmail, AuthError } from "firebase/auth";

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

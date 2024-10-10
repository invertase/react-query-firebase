import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { type Auth, AuthError, revokeAccessToken } from "firebase/auth";

type RevokeAccessTokenParams = {
  token: string;
};

type AuthUseMutationOptions<
  TData = unknown,
  TError = Error,
  TVariables = void
> = Omit<UseMutationOptions<TData, TError, TVariables>, "mutationFn">;

export function useRevokeAccessTokenMutation(
  auth: Auth,
  options?: AuthUseMutationOptions<void, AuthError, RevokeAccessTokenParams>
) {
  return useMutation<void, AuthError, RevokeAccessTokenParams>({
    ...options,
    mutationFn: ({ token }) => revokeAccessToken(auth, token),
  });
}

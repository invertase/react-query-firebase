import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import {
  type Auth,
  type AuthCredential,
  type AuthError,
  signInWithCredential,
  type UserCredential,
} from "firebase/auth";

type AuthUseMutationOptions<TData = unknown, TError = Error> = Omit<
  UseMutationOptions<TData, TError, void>,
  "mutationFn"
>;

export function useSignInWithCredentialMutation(
  auth: Auth,
  credential: AuthCredential,
  options?: AuthUseMutationOptions<UserCredential, AuthError>
) {
  return useMutation<UserCredential, AuthError, void>({
    ...options,
    mutationFn: () => signInWithCredential(auth, credential),
  });
}

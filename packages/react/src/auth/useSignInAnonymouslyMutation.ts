import {
  type Auth,
  type UserCredential,
  type AuthError,
  signInAnonymously,
} from "firebase/auth";
import { type UseMutationOptions, useMutation } from "@tanstack/react-query";

type SignInAnonymouslyOptions = Omit<
  UseMutationOptions<UserCredential, AuthError, void>,
  "mutationFn"
>;

export function useSignInAnonymouslyMutation(
  auth: Auth,
  options?: SignInAnonymouslyOptions
) {
  return useMutation<UserCredential, AuthError, void>({
    ...options,
    mutationFn: () => signInAnonymously(auth),
  });
}

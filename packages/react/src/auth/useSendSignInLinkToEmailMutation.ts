import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import {
  type ActionCodeSettings,
  type Auth,
  AuthError,
  sendSignInLinkToEmail,
} from "firebase/auth";

type AuthUseMutationOptions<TData = unknown, TError = Error> = Omit<
  UseMutationOptions<TData, TError, void>,
  "mutationFn"
>;

export function useSendSignInLinkToEmailMutation(
  auth: Auth,
  email: string,
  actionCodeSettings: ActionCodeSettings,
  options?: AuthUseMutationOptions
) {
  return useMutation<void, AuthError, void>({
    ...options,
    mutationFn: () => sendSignInLinkToEmail(auth, email, actionCodeSettings),
  });
}

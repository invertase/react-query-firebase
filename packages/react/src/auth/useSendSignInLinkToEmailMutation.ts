import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import {
  type ActionCodeSettings,
  type Auth,
  AuthError,
  sendSignInLinkToEmail,
} from "firebase/auth";

type SendSignInLinkParams = {
  email: string;
  actionCodeSettings: ActionCodeSettings;
};

type AuthUseMutationOptions<
  TData = unknown,
  TError = Error,
  TVariables = void
> = Omit<UseMutationOptions<TData, TError, TVariables>, "mutationFn">;

export function useSendSignInLinkToEmailMutation(
  auth: Auth,
  options?: AuthUseMutationOptions<void, AuthError, SendSignInLinkParams>
) {
  return useMutation<void, AuthError, SendSignInLinkParams>({
    ...options,
    mutationFn: ({ email, actionCodeSettings }) =>
      sendSignInLinkToEmail(auth, email, actionCodeSettings),
  });
}

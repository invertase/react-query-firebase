import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from "react-query";

type User = FirebaseAuthTypes.User;
type Auth = FirebaseAuthTypes.Module;
type AuthError = FirebaseAuthTypes.NativeFirebaseAuthError;
type UserCredential = FirebaseAuthTypes.UserCredential;
type AuthCredential = FirebaseAuthTypes.AuthCredential;
type ConfirmationResult = FirebaseAuthTypes.ConfirmationResult;
type ActionCodeSettings = FirebaseAuthTypes.ActionCodeSettings;
type ActionCodeInfo = FirebaseAuthTypes.ActionCodeInfo;

export function useAuthApplyActionCode(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<void, AuthError, string>
): UseMutationResult<void, AuthError, string> {
  return useMutation<void, AuthError, string>((oobCode) => {
    return auth.applyActionCode(oobCode);
  }, useMutationOptions);
}

export function useAuthCheckActionCode(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<ActionCodeInfo, AuthError, string>
): UseMutationResult<ActionCodeInfo, AuthError, string> {
  return useMutation<ActionCodeInfo, AuthError, string>((oobCode) => {
    return auth.checkActionCode(oobCode);
  }, useMutationOptions);
}

export function useAuthConfirmPasswordReset(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<
    void,
    AuthError,
    { oobCode: string; newPassword: string }
  >
): UseMutationResult<
  void,
  AuthError,
  { oobCode: string; newPassword: string }
> {
  return useMutation<void, AuthError, { oobCode: string; newPassword: string }>(
    ({ oobCode, newPassword }) => {
      return auth.confirmPasswordReset(oobCode, newPassword);
    },
    useMutationOptions
  );
}

export function useAuthCreateUserWithEmailAndPassword(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<
    UserCredential,
    AuthError,
    { email: string; password: string }
  >
): UseMutationResult<
  UserCredential,
  AuthError,
  { email: string; password: string }
> {
  return useMutation<
    UserCredential,
    AuthError,
    { email: string; password: string }
  >(({ email, password }) => {
    return auth.createUserWithEmailAndPassword(email, password);
  }, useMutationOptions);
}

export function useAuthDeleteUser(
  useMutationOptions?: UseMutationOptions<void, AuthError, User>
): UseMutationResult<void, AuthError, User> {
  return useMutation<void, AuthError, User>((user) => {
    return user.delete();
  }, useMutationOptions);
}

export function useAuthLinkWithCredential(
  useMutationOptions?: UseMutationOptions<
    UserCredential,
    AuthError,
    { user: User; credential: AuthCredential }
  >
): UseMutationResult<
  UserCredential,
  AuthError,
  { user: User; credential: AuthCredential }
> {
  return useMutation<
    UserCredential,
    AuthError,
    { user: User; credential: AuthCredential }
  >(({ user, credential }) => {
    return user.linkWithCredential(credential);
  }, useMutationOptions);
}

export function useAuthReauthenticateWithCredential(
  useMutationOptions?: UseMutationOptions<
    UserCredential,
    AuthError,
    { user: User; credential: AuthCredential }
  >
): UseMutationResult<
  UserCredential,
  AuthError,
  { user: User; credential: AuthCredential }
> {
  return useMutation<
    UserCredential,
    AuthError,
    { user: User; credential: AuthCredential }
  >(({ user, credential }) => {
    return user.reauthenticateWithCredential(credential);
  }, useMutationOptions);
}

export function useAuthReload(
  useMutationOptions?: UseMutationOptions<void, AuthError, User>
): UseMutationResult<void, AuthError, User> {
  return useMutation<void, AuthError, User>((user) => {
    return user.reload();
  }, useMutationOptions);
}

export function useAuthSendEmailVerification(
  useMutationOptions?: UseMutationOptions<
    void,
    AuthError,
    { user: User; actionCodeSettings?: ActionCodeSettings | null }
  >
): UseMutationResult<
  void,
  AuthError,
  { user: User; actionCodeSettings?: ActionCodeSettings | null }
> {
  return useMutation<
    void,
    AuthError,
    { user: User; actionCodeSettings?: ActionCodeSettings | null }
  >(({ user, actionCodeSettings }) => {
    return user.sendEmailVerification(actionCodeSettings as ActionCodeSettings);
  }, useMutationOptions);
}

export function useAuthSendPasswordResetEmail(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<
    void,
    AuthError,
    { email: string; actionCodeSettings?: ActionCodeSettings }
  >
): UseMutationResult<
  void,
  AuthError,
  { email: string; actionCodeSettings?: ActionCodeSettings }
> {
  return useMutation<
    void,
    AuthError,
    { email: string; actionCodeSettings?: ActionCodeSettings }
  >(({ email, actionCodeSettings }) => {
    return auth.sendPasswordResetEmail(email, actionCodeSettings);
  }, useMutationOptions);
}

export function useAuthSendSignInLinkToEmail(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<
    void,
    AuthError,
    { email: string; actionCodeSettings: ActionCodeSettings }
  >
): UseMutationResult<
  void,
  AuthError,
  { email: string; actionCodeSettings: ActionCodeSettings }
> {
  return useMutation<
    void,
    AuthError,
    { email: string; actionCodeSettings: ActionCodeSettings }
  >(({ email, actionCodeSettings }) => {
    return auth.sendSignInLinkToEmail(email, actionCodeSettings);
  }, useMutationOptions);
}

export function useAuthSignInAnonymously(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<
    UserCredential,
    AuthError,
    { email: string; password: string }
  >
): UseMutationResult<
  UserCredential,
  AuthError,
  { email: string; password: string }
> {
  return useMutation<
    UserCredential,
    AuthError,
    { email: string; password: string }
  >(() => {
    return auth.signInAnonymously();
  }, useMutationOptions);
}

export function useAuthSignInWithCredential(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<
    UserCredential,
    AuthError,
    AuthCredential
  >
): UseMutationResult<UserCredential, AuthError, AuthCredential> {
  return useMutation<UserCredential, AuthError, AuthCredential>(
    (credential) => {
      return auth.signInWithCredential(credential);
    },
    useMutationOptions
  );
}

export function useAuthSignInWithCustomToken(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<UserCredential, AuthError, string>
): UseMutationResult<UserCredential, AuthError, string> {
  return useMutation<UserCredential, AuthError, string>((customToken) => {
    return auth.signInWithCustomToken(customToken);
  }, useMutationOptions);
}

export function useAuthSignInWithEmailAndPassword(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<
    UserCredential,
    AuthError,
    { email: string; password: string }
  >
): UseMutationResult<
  UserCredential,
  AuthError,
  { email: string; password: string }
> {
  return useMutation<
    UserCredential,
    AuthError,
    { email: string; password: string }
  >(({ email, password }) => {
    return auth.signInWithEmailAndPassword(email, password);
  }, useMutationOptions);
}

export function useAuthSignInWithEmailLink(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<
    UserCredential,
    AuthError,
    { email: string; emailLink?: string }
  >
): UseMutationResult<
  UserCredential,
  AuthError,
  { email: string; emailLink?: string }
> {
  return useMutation<
    UserCredential,
    AuthError,
    { email: string; emailLink?: string }
  >(({ email, emailLink }) => {
    return auth.signInWithEmailLink(email, emailLink as string);
  }, useMutationOptions);
}

export function useAuthSignInWithPhoneNumber(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<
    ConfirmationResult,
    AuthError,
    { phoneNumber: string; forceResend?: boolean }
  >
): UseMutationResult<
  ConfirmationResult,
  AuthError,
  { phoneNumber: string; forceResend?: boolean }
> {
  return useMutation<
    ConfirmationResult,
    AuthError,
    { phoneNumber: string; forceResend?: boolean }
  >(({ phoneNumber, forceResend }) => {
    return auth.signInWithPhoneNumber(phoneNumber, forceResend);
  }, useMutationOptions);
}

export function useAuthSignOut(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<void, AuthError, void>
): UseMutationResult<void, AuthError, void> {
  return useMutation<void, AuthError, void>(() => {
    return auth.signOut();
  }, useMutationOptions);
}

export function useAuthUnlink(
  useMutationOptions?: UseMutationOptions<
    User,
    AuthError,
    { user: User; providerId: string }
  >
): UseMutationResult<User, AuthError, { user: User; providerId: string }> {
  return useMutation<User, AuthError, { user: User; providerId: string }>(
    ({ user, providerId }) => {
      return user.unlink(providerId);
    },
    useMutationOptions
  );
}

export function useAuthUpdateEmail(
  useMutationOptions?: UseMutationOptions<
    void,
    AuthError,
    { user: User; newEmail: string }
  >
): UseMutationResult<void, AuthError, { user: User; newEmail: string }> {
  return useMutation<void, AuthError, { user: User; newEmail: string }>(
    ({ user, newEmail }) => {
      return user.updateEmail(newEmail);
    },
    useMutationOptions
  );
}

export function useAuthUpdatePassword(
  useMutationOptions?: UseMutationOptions<
    void,
    AuthError,
    { user: User; newPassword: string }
  >
): UseMutationResult<void, AuthError, { user: User; newPassword: string }> {
  return useMutation<void, AuthError, { user: User; newPassword: string }>(
    ({ user, newPassword }) => {
      return user.updatePassword(newPassword);
    },
    useMutationOptions
  );
}

export function useAuthUpdatePhoneNumber(
  useMutationOptions?: UseMutationOptions<
    void,
    AuthError,
    { user: User; credential: AuthCredential }
  >
): UseMutationResult<
  void,
  AuthError,
  { user: User; credential: AuthCredential }
> {
  return useMutation<
    void,
    AuthError,
    { user: User; credential: AuthCredential }
  >(({ user, credential }) => {
    return user.updatePhoneNumber(credential);
  }, useMutationOptions);
}

export function useAuthUpdateProfile(
  useMutationOptions?: UseMutationOptions<
    void,
    AuthError,
    { user: User; displayName?: string | null; photoURL?: string | null }
  >
): UseMutationResult<
  void,
  AuthError,
  { user: User; displayName?: string | null; photoURL?: string | null }
> {
  return useMutation<
    void,
    AuthError,
    { user: User; displayName?: string | null; photoURL?: string | null }
  >(({ user, ...update }) => {
    return user.updateProfile(update);
  }, useMutationOptions);
}

export function useAuthVerifyBeforeUpdateEmail(
  useMutationOptions?: UseMutationOptions<
    void,
    AuthError,
    { user: User; newEmail: string; actionCodeSettings?: ActionCodeSettings }
  >
): UseMutationResult<
  void,
  AuthError,
  { user: User; newEmail: string; actionCodeSettings?: ActionCodeSettings }
> {
  return useMutation<
    void,
    AuthError,
    { user: User; newEmail: string; actionCodeSettings?: ActionCodeSettings }
  >(({ user, newEmail, actionCodeSettings }) => {
    return user.verifyBeforeUpdateEmail(newEmail, actionCodeSettings);
  }, useMutationOptions);
}

export function useAuthVerifyPasswordResetCode(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<void, AuthError, string>
): UseMutationResult<void, AuthError, string> {
  return useMutation<void, AuthError, string>((code) => {
    return auth.verifyPasswordResetCode(code);
  }, useMutationOptions);
}

import {
  ActionCodeInfo,
  ActionCodeSettings,
  ApplicationVerifier,
  applyActionCode,
  Auth,
  AuthCredential,
  AuthError,
  AuthProvider,
  checkActionCode,
  createUserWithEmailAndPassword,
  ConfirmationResult,
  confirmPasswordReset,
  deleteUser,
  linkWithCredential,
  linkWithPhoneNumber,
  linkWithPopup,
  linkWithRedirect,
  PhoneAuthCredential,
  PopupRedirectResolver,
  reauthenticateWithCredential,
  reauthenticateWithPhoneNumber,
  reauthenticateWithPopup,
  reauthenticateWithRedirect,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInAnonymously,
  signInWithCredential,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  unlink,
  updateCurrentUser,
  updateEmail,
  updatePassword,
  updatePhoneNumber,
  updateProfile,
  User,
  UserCredential,
  verifyBeforeUpdateEmail,
  verifyPasswordResetCode,
} from "@firebase/auth";
import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from "react-query";

export function useAuthApplyActionCode(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<void, AuthError, string>
): UseMutationResult<void, AuthError, string> {
  return useMutation<void, AuthError, string>((oobCode) => {
    return applyActionCode(auth, oobCode);
  }, useMutationOptions);
}

export function useAuthCheckActionCode(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<ActionCodeInfo, AuthError, string>
): UseMutationResult<ActionCodeInfo, AuthError, string> {
  return useMutation<ActionCodeInfo, AuthError, string>((oobCode) => {
    return checkActionCode(auth, oobCode);
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
      return confirmPasswordReset(auth, oobCode, newPassword);
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
    return createUserWithEmailAndPassword(auth, email, password);
  }, useMutationOptions);
}

export function useAuthDeleteUser(
  useMutationOptions?: UseMutationOptions<void, AuthError, User>
): UseMutationResult<void, AuthError, User> {
  return useMutation<void, AuthError, User>((user) => {
    return deleteUser(user);
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
    return linkWithCredential(user, credential);
  }, useMutationOptions);
}

export function useAuthLinkWithPhoneNumber(
  useMutationOptions?: UseMutationOptions<
    ConfirmationResult,
    AuthError,
    { user: User; phoneNumber: string; appVerifier: ApplicationVerifier }
  >
): UseMutationResult<
  ConfirmationResult,
  AuthError,
  { user: User; phoneNumber: string; appVerifier: ApplicationVerifier }
> {
  return useMutation<
    ConfirmationResult,
    AuthError,
    { user: User; phoneNumber: string; appVerifier: ApplicationVerifier }
  >(({ user, phoneNumber, appVerifier }) => {
    return linkWithPhoneNumber(user, phoneNumber, appVerifier);
  }, useMutationOptions);
}

export function useAuthLinkWithPopup(
  useMutationOptions?: UseMutationOptions<
    UserCredential,
    AuthError,
    { user: User; provider: AuthProvider; resolver?: PopupRedirectResolver }
  >
): UseMutationResult<
  UserCredential,
  AuthError,
  { user: User; provider: AuthProvider; resolver?: PopupRedirectResolver }
> {
  return useMutation<
    UserCredential,
    AuthError,
    { user: User; provider: AuthProvider; resolver?: PopupRedirectResolver }
  >(({ user, provider, resolver }) => {
    return linkWithPopup(user, provider, resolver);
  }, useMutationOptions);
}

export function useAuthLinkWithRedirect(
  useMutationOptions?: UseMutationOptions<
    never,
    AuthError,
    { user: User; provider: AuthProvider; resolver?: PopupRedirectResolver }
  >
): UseMutationResult<
  never,
  AuthError,
  { user: User; provider: AuthProvider; resolver?: PopupRedirectResolver }
> {
  return useMutation<
    never,
    AuthError,
    { user: User; provider: AuthProvider; resolver?: PopupRedirectResolver }
  >(({ user, provider, resolver }) => {
    return linkWithRedirect(user, provider, resolver);
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
    return reauthenticateWithCredential(user, credential);
  }, useMutationOptions);
}

export function useAuthReauthenticateWithPhoneNumber(
  useMutationOptions?: UseMutationOptions<
    ConfirmationResult,
    AuthError,
    { user: User; phoneNumber: string; appVerifier: ApplicationVerifier }
  >
): UseMutationResult<
  ConfirmationResult,
  AuthError,
  { user: User; phoneNumber: string; appVerifier: ApplicationVerifier }
> {
  return useMutation<
    ConfirmationResult,
    AuthError,
    { user: User; phoneNumber: string; appVerifier: ApplicationVerifier }
  >(({ user, phoneNumber, appVerifier }) => {
    return reauthenticateWithPhoneNumber(user, phoneNumber, appVerifier);
  }, useMutationOptions);
}

export function useAuthReauthenticateWithPopup(
  useMutationOptions?: UseMutationOptions<
    UserCredential,
    AuthError,
    { user: User; provider: AuthProvider; resolver?: PopupRedirectResolver }
  >
): UseMutationResult<
  UserCredential,
  AuthError,
  { user: User; provider: AuthProvider; resolver?: PopupRedirectResolver }
> {
  return useMutation<
    UserCredential,
    AuthError,
    { user: User; provider: AuthProvider; resolver?: PopupRedirectResolver }
  >(({ user, provider, resolver }) => {
    return reauthenticateWithPopup(user, provider, resolver);
  }, useMutationOptions);
}

export function useAuthReauthenticateWithRedirect(
  useMutationOptions?: UseMutationOptions<
    never,
    AuthError,
    { user: User; provider: AuthProvider; resolver?: PopupRedirectResolver }
  >
): UseMutationResult<
  never,
  AuthError,
  { user: User; provider: AuthProvider; resolver?: PopupRedirectResolver }
> {
  return useMutation<
    never,
    AuthError,
    { user: User; provider: AuthProvider; resolver?: PopupRedirectResolver }
  >(({ user, provider, resolver }) => {
    return reauthenticateWithRedirect(user, provider, resolver);
  }, useMutationOptions);
}

export function useAuthReload(
  useMutationOptions?: UseMutationOptions<void, AuthError, User>
): UseMutationResult<void, AuthError, User> {
  return useMutation<void, AuthError, User>((user) => {
    return reload(user);
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
    return sendEmailVerification(user, actionCodeSettings);
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
    return sendPasswordResetEmail(auth, email, actionCodeSettings);
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
    return sendSignInLinkToEmail(auth, email, actionCodeSettings);
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
    return signInAnonymously(auth);
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
      return signInWithCredential(auth, credential);
    },
    useMutationOptions
  );
}

export function useAuthSignInWithCustomToken(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<UserCredential, AuthError, string>
): UseMutationResult<UserCredential, AuthError, string> {
  return useMutation<UserCredential, AuthError, string>((customToken) => {
    return signInWithCustomToken(auth, customToken);
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
    return signInWithEmailAndPassword(auth, email, password);
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
    return signInWithEmailLink(auth, email, emailLink);
  }, useMutationOptions);
}

export function useAuthSignInWithPhoneNumber(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<
    ConfirmationResult,
    AuthError,
    { phoneNumber: string; appVerifier: ApplicationVerifier }
  >
): UseMutationResult<
  ConfirmationResult,
  AuthError,
  { phoneNumber: string; appVerifier: ApplicationVerifier }
> {
  return useMutation<
    ConfirmationResult,
    AuthError,
    { phoneNumber: string; appVerifier: ApplicationVerifier }
  >(({ phoneNumber, appVerifier }) => {
    return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  }, useMutationOptions);
}

export function useAuthSignInWithPopup(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<
    UserCredential,
    AuthError,
    { provider: AuthProvider; resolver?: PopupRedirectResolver }
  >
): UseMutationResult<
  UserCredential,
  AuthError,
  { provider: AuthProvider; resolver?: PopupRedirectResolver }
> {
  return useMutation<
    UserCredential,
    AuthError,
    { provider: AuthProvider; resolver?: PopupRedirectResolver }
  >(({ provider, resolver }) => {
    return signInWithPopup(auth, provider, resolver);
  }, useMutationOptions);
}

export function useAuthSignInWithRedirect(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<
    never,
    AuthError,
    { provider: AuthProvider; resolver?: PopupRedirectResolver }
  >
): UseMutationResult<
  never,
  AuthError,
  { provider: AuthProvider; resolver?: PopupRedirectResolver }
> {
  return useMutation<
    never,
    AuthError,
    { provider: AuthProvider; resolver?: PopupRedirectResolver }
  >(({ provider, resolver }) => {
    return signInWithRedirect(auth, provider, resolver);
  }, useMutationOptions);
}

export function useAuthSignOut(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<void, AuthError, void>
): UseMutationResult<void, AuthError, void> {
  return useMutation<void, AuthError, void>(() => {
    return signOut(auth);
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
      return unlink(user, providerId);
    },
    useMutationOptions
  );
}

export function useAuthUpdateCurrentUser(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<void, AuthError, User | null>
): UseMutationResult<void, AuthError, User | null> {
  return useMutation<void, AuthError, User | null>((user) => {
    return updateCurrentUser(auth, user);
  }, useMutationOptions);
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
      return updateEmail(user, newEmail);
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
      return updatePassword(user, newPassword);
    },
    useMutationOptions
  );
}

export function useAuthUpdatePhoneNumber(
  useMutationOptions?: UseMutationOptions<
    void,
    AuthError,
    { user: User; credential: PhoneAuthCredential }
  >
): UseMutationResult<
  void,
  AuthError,
  { user: User; credential: PhoneAuthCredential }
> {
  return useMutation<
    void,
    AuthError,
    { user: User; credential: PhoneAuthCredential }
  >(({ user, credential }) => {
    return updatePhoneNumber(user, credential);
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
    return updateProfile(user, update);
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
    return verifyBeforeUpdateEmail(user, newEmail, actionCodeSettings);
  }, useMutationOptions);
}

export function useAuthVerifyPasswordResetCode(
  auth: Auth,
  useMutationOptions?: UseMutationOptions<string, AuthError, string>
): UseMutationResult<string, AuthError, string> {
  return useMutation<string, AuthError, string>((code) => {
    return verifyPasswordResetCode(auth, code);
  }, useMutationOptions);
}

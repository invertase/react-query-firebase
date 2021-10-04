import {
  ActionCodeInfo,
  applyActionCode,
  Auth,
  AuthError,
  checkActionCode,
  confirmPasswordReset,
  deleteUser,
  signInWithEmailAndPassword,
  UserCredential,
} from "@firebase/auth";
import { useMutation } from "react-query";

export function useAuthApplyActionCode(auth: Auth) {
  return useMutation<void, AuthError, string>((oobCode) => {
    return applyActionCode(auth, oobCode);
  });
}

export function useAuthCheckActionCode(auth: Auth) {
  return useMutation<ActionCodeInfo, AuthError, string>((oobCode) => {
    return checkActionCode(auth, oobCode);
  });
}

type ConfirmPasswordResetArgs = {
  oobCode: string;
  newPassword: string;
};

export function useAuthConfirmPasswordReset(auth: Auth) {
  return useMutation<void, AuthError, ConfirmPasswordResetArgs>(
    ({ oobCode, newPassword }) => {
      return confirmPasswordReset(auth, oobCode, newPassword);
    }
  );
}

type CreateUserWithEmailAndPasswordArgs = {
  email: string;
  password: string;
}

export function useAuthCreateUserWithEmailAndPassword(auth: Auth) {
  return useMutation<void, AuthError, CreateUserWithEmailAndPasswordArgs>(
    ({ email, password }) => {
      return confirmPasswordReset(auth, email, password);
    }
  );
}

export function useAuthDeleteUser(auth: Auth) {
  return useMutation<void, AuthError, CreateUserWithEmailAndPasswordArgs>(
    () => {
      return deleteUser(auth.currentUser!);
    }
  );
}

type SignInWithEmailAndPasswordArgs = {
  email: string;
  password: string;
};

export function useAuthSignInWithEmailAndPassword(auth: Auth) {
  return useMutation<UserCredential, AuthError, SignInWithEmailAndPasswordArgs>(
    ({ email, password }) => {
      return signInWithEmailAndPassword(auth, email, password);
    }
  );
}

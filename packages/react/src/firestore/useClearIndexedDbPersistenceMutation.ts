import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import {
  clearIndexedDbPersistence,
  type Firestore,
  type FirestoreError,
} from "firebase/firestore";

type FirestoreUseMutationOptions<TData = unknown, TError = Error> = Omit<
  UseMutationOptions<TData, TError, void>,
  "mutationFn"
>;

export function useClearIndexedDbPersistenceMutation(
  firestore: Firestore,
  options?: FirestoreUseMutationOptions<void, FirestoreError>
) {
  return useMutation<void, FirestoreError>({
    ...options,
    mutationFn: () => clearIndexedDbPersistence(firestore),
  });
}

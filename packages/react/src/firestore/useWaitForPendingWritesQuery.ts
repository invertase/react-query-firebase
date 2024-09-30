import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import {
  Firestore,
  FirestoreError,
  waitForPendingWrites,
} from "firebase/firestore";

type FirestoreUseMutationOptions<TData = unknown, TError = Error> = Omit<
  UseMutationOptions<TData, TError, void>,
  "mutationFn"
>;

export function useWaitForPendingWritesQuery(
  firestore: Firestore,
  options?: FirestoreUseMutationOptions<void, FirestoreError>
) {
  return useMutation<void, FirestoreError, void>({
    ...options,
    mutationFn: () => waitForPendingWrites(firestore),
  });
}

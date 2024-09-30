import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import {
  type Firestore,
  type FirestoreError,
  type WriteBatch,
  writeBatch,
} from "firebase/firestore";

type FirestoreUseMutationOptions<TData = unknown, TError = Error> = Omit<
  UseMutationOptions<TData, TError>,
  "mutationFn"
>;

export function useWriteBatchCommitMutation(
  firestore: Firestore,
  options?: FirestoreUseMutationOptions<WriteBatch, FirestoreError>
) {
  return useMutation<WriteBatch, FirestoreError, void>({
    ...options,
    mutationFn: async () => await writeBatch(firestore),
  });
}

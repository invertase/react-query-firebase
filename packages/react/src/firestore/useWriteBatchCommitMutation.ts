import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { type FirestoreError, type WriteBatch } from "firebase/firestore";

type FirestoreUseMutationOptions<TError = Error> = Omit<
  UseMutationOptions<void, TError, WriteBatch>,
  "mutationFn"
>;

export function useWriteBatchCommitMutation(
  options?: FirestoreUseMutationOptions<FirestoreError>
) {
  return useMutation<void, FirestoreError, WriteBatch>({
    ...options,
    mutationFn: async (batch: WriteBatch) => {
      await batch.commit();
    },
  });
}

import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import {
  Firestore,
  FirestoreError,
  Transaction,
  runTransaction,
  TransactionOptions,
} from "firebase/firestore";

type RunTransactionFunction<T> = (transaction: Transaction) => Promise<T>;

type FirestoreUseMutationOptions<TData = unknown, TError = Error> = Omit<
  UseMutationOptions<TData, TError, void>,
  "mutationFn"
> & {
  firestore?: TransactionOptions;
};

export function useRunTransactionMutation<T>(
  firestore: Firestore,
  updateFunction: RunTransactionFunction<T>,
  options?: FirestoreUseMutationOptions<T>
) {
  const { firestore: firestoreOptions, ...queryOptions } = options ?? {};

  return useMutation<T, FirestoreError, void>({
    ...queryOptions,
    mutationFn: () =>
      runTransaction(firestore, updateFunction, firestoreOptions),
  });
}

import { useMutation, UseMutationOptions } from "react-query";
import {
  DatabaseReference,
  remove,
  runTransaction,
  set,
  setWithPriority,
  TransactionOptions,
  TransactionResult,
  update,
} from "@firebase/database";

export type UseDatabaseSetMutationOptions = {
  priority?: string | number | null;
};

export function useDatabaseSetMutation<T = unknown>(
  ref: DatabaseReference,
  options?: UseDatabaseSetMutationOptions,
  useMutationOptions?: UseMutationOptions<void, Error, T>
) {
  return useMutation<void, Error, T>((value) => {
    if (options?.priority !== undefined) {
      return setWithPriority(ref, value, options.priority);
    }

    return set(ref, value);
  }, useMutationOptions);
}

type UpdateValues = Record<string, unknown>;

export function useDatabaseUpdateMutation<
  T extends UpdateValues = UpdateValues
>(
  ref: DatabaseReference,
  useMutationOptions?: UseMutationOptions<void, Error, T>
) {
  return useMutation<void, Error, T>((values) => {
    return update(ref, values);
  }, useMutationOptions);
}

export function useDatabaseRemoveMutation(
  ref: DatabaseReference,
  useMutationOptions?: UseMutationOptions<void, Error, void>
) {
  return useMutation<void, Error, void>(() => {
    return remove(ref);
  }, useMutationOptions);
}

export function useDatabaseTransactionMutation<T = any>(
  ref: DatabaseReference,
  transactionUpdate: (currentData: T | null) => unknown,
  options?: TransactionOptions,
  useMutationOptions?: UseMutationOptions<TransactionResult, Error, void>
) {
  return useMutation<TransactionResult, Error, void>(() => {
    return runTransaction(ref, transactionUpdate, options);
  }, useMutationOptions);
}

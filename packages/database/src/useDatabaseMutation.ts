import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from "react-query";
import {
  FirebaseDatabaseTypes
} from "@react-native-firebase/database";

export type UseDatabaseSetMutationOptions = {
  priority?: string | number | null;
};

export function useDatabaseSetMutation<T = unknown>(
  ref: FirebaseDatabaseTypes.Reference,
  options?: UseDatabaseSetMutationOptions,
  useMutationOptions?: UseMutationOptions<void, Error, T>
): UseMutationResult<void, Error, T> {
  return useMutation<void, Error, T>((value) => {
    if (options?.priority !== undefined) {
      return ref.setWithPriority(value, options.priority);
    }

    return ref.set(value);
  }, useMutationOptions);
}

type UpdateValues = Record<string, unknown>;

export function useDatabaseUpdateMutation<
  T extends UpdateValues = UpdateValues
>(
  ref: FirebaseDatabaseTypes.Reference,
  useMutationOptions?: UseMutationOptions<void, Error, T>
): UseMutationResult<void, Error, T> {
  return useMutation<void, Error, T>((values) => {
    return ref.update(values);
  }, useMutationOptions);
}

export function useDatabaseRemoveMutation(
  ref: FirebaseDatabaseTypes.Reference,
  useMutationOptions?: UseMutationOptions<void, Error, void>
): UseMutationResult<void, Error, void> {
  return useMutation<void, Error, void>(() => {
    return ref.remove();
  }, useMutationOptions);
}

export function useDatabaseTransaction<T = any>(
  ref: FirebaseDatabaseTypes.Reference,
  transactionUpdate: (currentData: T | null) => unknown,
  options: {applyLocally?: boolean},
  useMutationOptions?: UseMutationOptions<FirebaseDatabaseTypes.TransactionResult, Error, void>
): UseMutationResult<FirebaseDatabaseTypes.TransactionResult, Error, void> {
  return useMutation<FirebaseDatabaseTypes.TransactionResult, Error, void>(() => {
    return ref.transaction(
      transactionUpdate as any,
      undefined,
      options.applyLocally);
  }, useMutationOptions);
}

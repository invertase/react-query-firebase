import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  type Firestore,
  type FirestoreError,
  waitForPendingWrites,
} from "firebase/firestore";

type FirestoreUseQueryOptions<TData = unknown, TError = Error> = Omit<
  UseQueryOptions<TData, TError, void>,
  "queryFn"
>;

export function useWaitForPendingWritesQuery(
  firestore: Firestore,
  options: FirestoreUseQueryOptions<void, FirestoreError>
) {
  return useQuery<void, FirestoreError, void>({
    ...options,
    queryFn: () => waitForPendingWrites(firestore),
  });
}

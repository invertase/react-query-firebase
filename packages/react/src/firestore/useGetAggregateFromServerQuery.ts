import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  type Query,
  type FirestoreError,
  getAggregateFromServer,
  type AggregateSpec,
  type AggregateField,
} from "firebase/firestore";

type FirestoreUseQueryOptions<TData = unknown, TError = Error> = Omit<
  UseQueryOptions<TData, TError>,
  "queryFn"
>;

// map the AggregateSpec to its result type, thus resolving the AggregateField to its actual value type
type AggregateResult<T extends AggregateSpec> = {
  [K in keyof T]: AggregateField<T[K]> extends AggregateField<infer R>
    ? R
    : never;
};

export function useGetAggregateFromServerQuery<T extends AggregateSpec>(
  query: Query,
  aggregateSpec: T,
  options: FirestoreUseQueryOptions<AggregateResult<T>, FirestoreError>
) {
  return useQuery<AggregateResult<T>, FirestoreError>({
    ...options,
    queryFn: async () => {
      const snapshot = await getAggregateFromServer(query, aggregateSpec);
      return snapshot.data() as AggregateResult<T>;
    },
  });
}

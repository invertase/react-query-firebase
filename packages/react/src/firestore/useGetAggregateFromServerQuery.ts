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
> & {
  firestore: {
    aggregateSpec: AggregateSpec;
  };
};

type AggregateResult<T extends AggregateSpec> = {
  [K in keyof T]: AggregateField<T[K]> extends AggregateField<infer R>
    ? R
    : never;
};

export function useGetAggregateFromServerQuery<T extends AggregateSpec>(
  query: Query,
  options: FirestoreUseQueryOptions<AggregateResult<T>, FirestoreError>
) {
  const { firestore, ...queryOptions } = options;

  return useQuery<AggregateResult<T>, FirestoreError>({
    ...queryOptions,
    queryFn: async () => {
      const snapshot = await getAggregateFromServer(
        query,
        firestore.aggregateSpec
      );
      return snapshot.data() as AggregateResult<T>;
    },
  });
}

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  type Query,
  type FirestoreError,
  getAggregateFromServer,
  type AggregateSpec,
  DocumentData,
  AggregateSpecData,
} from "firebase/firestore";

type FirestoreUseQueryOptions<TData = unknown, TError = Error> = Omit<
  UseQueryOptions<TData, TError>,
  "queryFn"
>;

export function useGetAggregateFromServerQuery<
  T extends AggregateSpec,
  AppModelType extends DocumentData = DocumentData,
  DbModelType extends DocumentData = DocumentData
>(
  query: Query<AppModelType, DbModelType>,
  aggregateSpec: T,
  options: FirestoreUseQueryOptions<AggregateSpecData<T>, FirestoreError>
) {
  return useQuery<AggregateSpecData<T>, FirestoreError>({
    ...options,
    queryFn: async () => {
      const snapshot = await getAggregateFromServer(query, aggregateSpec);
      return snapshot.data();
    },
  });
}

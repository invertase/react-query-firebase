import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  type Query,
  type FirestoreError,
  getAggregateFromServer,
  type AggregateSpec,
  type DocumentData,
  type AggregateQuerySnapshot,
} from "firebase/firestore";

type FirestoreUseQueryOptions<TData = unknown, TError = Error> = Omit<
  UseQueryOptions<TData, TError>,
  "queryFn"
>;

export function useGetAggregateFromServerQuery<
  T extends AggregateSpec,
  AppModelType = DocumentData,
  DbModelType extends DocumentData = DocumentData
>(
  query: Query<AppModelType, DbModelType>,
  aggregateSpec: T,
  options: FirestoreUseQueryOptions<
    AggregateQuerySnapshot<T, AppModelType, DbModelType>,
    FirestoreError
  >
) {
  return useQuery<
    AggregateQuerySnapshot<T, AppModelType, DbModelType>,
    FirestoreError
  >({
    ...options,
    queryFn: async () => {
      const snapshot = await getAggregateFromServer(query, aggregateSpec);
      return snapshot;
    },
  });
}

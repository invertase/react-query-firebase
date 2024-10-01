import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  type AggregateField,
  type AggregateQuerySnapshot,
  getCountFromServer,
  type FirestoreError,
  type Query,
  type DocumentData,
} from "firebase/firestore";

type FirestoreUseQueryOptions<TData = unknown, TError = Error> = Omit<
  UseQueryOptions<TData, TError>,
  "queryFn"
>;

export function useGetCountFromServerQuery<
  AppModelType = DocumentData,
  DbModelType extends DocumentData = DocumentData
>(
  query: Query<AppModelType, DbModelType>,
  options: FirestoreUseQueryOptions<
    AggregateQuerySnapshot<
      { count: AggregateField<number> },
      AppModelType,
      DbModelType
    >,
    FirestoreError
  >
) {
  return useQuery<
    AggregateQuerySnapshot<
      { count: AggregateField<number> },
      AppModelType,
      DbModelType
    >,
    FirestoreError
  >({
    ...options,
    queryFn: () => getCountFromServer(query),
  });
}

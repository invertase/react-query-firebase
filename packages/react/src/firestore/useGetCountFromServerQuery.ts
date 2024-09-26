import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  getCountFromServer,
  type FirestoreError,
  type Query,
} from "firebase/firestore";

type FirestoreUseQueryOptions<TData = unknown, TError = Error> = Omit<
  UseQueryOptions<TData, TError>,
  "queryFn"
>;

export function useGetCountFromServerQuery(
  query: Query,
  options: FirestoreUseQueryOptions<number, FirestoreError>
) {
  return useQuery<number, FirestoreError>({
    ...options,
    queryFn: async () => {
      const snapshot = await getCountFromServer(query);
      return snapshot.data().count;
    },
  });
}

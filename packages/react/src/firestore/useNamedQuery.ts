import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  type FirestoreError,
  getDocs,
  type Query,
  type QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";

type FirestoreUseQueryOptions<TData = unknown, TError = Error> = Omit<
  UseQueryOptions<TData, TError>,
  "queryFn"
> & {
  firestore?: {
    transform?: (snapshot: QuerySnapshot<DocumentData>) => TData;
  };
};

export function useNamedQuery<TData = QuerySnapshot<DocumentData>>(
  query: Query,
  options: FirestoreUseQueryOptions<TData, FirestoreError>
) {
  const { firestore, ...queryOptions } = options;

  return useQuery<TData, FirestoreError>({
    ...queryOptions,
    queryFn: async () => {
      const snapshot = await getDocs(query);
      if (firestore?.transform) {
        return firestore.transform(snapshot);
      }
      return snapshot as TData;
    },
  });
}

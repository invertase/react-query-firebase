import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  type DocumentData,
  type DocumentSnapshot,
  type DocumentReference,
  type FirestoreError,
  getDoc,
  getDocFromCache,
  getDocFromServer,
} from "firebase/firestore";

type FirestoreUseQueryOptions<TData = unknown, TError = Error> = Omit<
  UseQueryOptions<TData, TError>,
  "queryFn"
> & {
  firestore?: {
    source?: "server" | "cache";
  };
};

export function useDocumentQuery<
  FromFirestore extends DocumentData = DocumentData,
  ToFirestore extends DocumentData = DocumentData
>(
  documentRef: DocumentReference<FromFirestore, ToFirestore>,
  options: FirestoreUseQueryOptions<
    DocumentSnapshot<FromFirestore, ToFirestore>,
    FirestoreError
  >
) {
  const { firestore, ...queryOptions } = options;

  return useQuery<DocumentSnapshot<FromFirestore, ToFirestore>, FirestoreError>(
    {
      ...queryOptions,
      queryFn: async () => {
        if (firestore?.source === "server") {
          return await getDocFromServer(documentRef);
        } else if (firestore?.source === "cache") {
          return await getDocFromCache(documentRef);
        } else {
          return await getDoc(documentRef);
        }
      },
    }
  );
}

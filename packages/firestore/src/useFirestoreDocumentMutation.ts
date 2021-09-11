import {
  DocumentData,
  DocumentReference,
  setDoc,
  SetOptions,
  WithFieldValue,
} from "firebase/firestore";
import { useMutation, UseMutationOptions } from "react-query";

export function useFirestoreDocumentMutation<T = DocumentData>(
  ref: DocumentReference<T>,
  options?: SetOptions,
  useMutationOptions?: UseMutationOptions<void, Error, WithFieldValue<T>>
) {
  return useMutation<void, Error, WithFieldValue<T>>((data) => {
    return setDoc<T>(ref, data, options);
  }, useMutationOptions);
}

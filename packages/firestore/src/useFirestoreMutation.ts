import {
  addDoc,
  CollectionReference,
  DocumentData,
  DocumentReference,
  setDoc,
  SetOptions,
  WithFieldValue,
} from "firebase/firestore";
import { useMutation, UseMutationOptions } from "react-query";

export function useFirestoreCollectionMutation<T = DocumentData>(
  ref: CollectionReference<T>,
  useMutationOptions?: UseMutationOptions<
    DocumentReference<T>,
    Error,
    WithFieldValue<T>
  >
) {
  return useMutation<DocumentReference<T>, Error, WithFieldValue<T>>((data) => {
    return addDoc<T>(ref, data);
  }, useMutationOptions);
}

export function useFirestoreDocumentMutation<T = DocumentData>(
  ref: DocumentReference<T>,
  options?: SetOptions,
  useMutationOptions?: UseMutationOptions<void, Error, WithFieldValue<T>>
) {
  return useMutation<void, Error, WithFieldValue<T>>((data) => {
    if (!!options) {
      return setDoc<T>(ref, data, options);
    }

    return setDoc<T>(ref, data);
  }, useMutationOptions);
}

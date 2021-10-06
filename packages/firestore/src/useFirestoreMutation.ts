/*
 * Copyright (c) 2016-present Invertase Limited & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this library except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import {
  addDoc,
  CollectionReference,
  deleteDoc,
  DocumentData,
  DocumentReference,
  Firestore,
  runTransaction,
  setDoc,
  SetOptions,
  Transaction,
  WithFieldValue,
  WriteBatch,
} from "firebase/firestore";
import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from "react-query";

export function useFirestoreCollectionMutation<T = DocumentData>(
  ref: CollectionReference<T>,
  useMutationOptions?: UseMutationOptions<
    DocumentReference<T>,
    Error,
    WithFieldValue<T>
  >
): UseMutationResult<DocumentReference<T>, Error, WithFieldValue<T>> {
  return useMutation<DocumentReference<T>, Error, WithFieldValue<T>>((data) => {
    return addDoc<T>(ref, data);
  }, useMutationOptions);
}

export function useFirestoreDocumentMutation<T = DocumentData>(
  ref: DocumentReference<T>,
  options?: SetOptions,
  useMutationOptions?: UseMutationOptions<void, Error, WithFieldValue<T>>
): UseMutationResult<void, Error, WithFieldValue<T>> {
  return useMutation<void, Error, WithFieldValue<T>>((data) => {
    if (options) {
      return setDoc<T>(ref, data, options);
    }

    return setDoc<T>(ref, data);
  }, useMutationOptions);
}

export function useFirestoreDocumentDeletion(
  ref: DocumentReference,
  useMutationOptions?: UseMutationOptions<void, Error, void>
): UseMutationResult<void, Error, void> {
  return useMutation<void, Error, void>(
    () => deleteDoc(ref),
    useMutationOptions
  );
}

export function useFirestoreTransaction<T = void>(
  firestore: Firestore,
  updateFunction: (tsx: Transaction) => Promise<T>,
  useMutationOptions?: UseMutationOptions<T, Error, void>
): UseMutationResult<T, Error, void> {
  return useMutation<T, Error, void>(() => {
    return runTransaction<T>(firestore, updateFunction);
  }, useMutationOptions);
}

export function useFirestoreWriteBatch(
  batch: WriteBatch,
  useMutationOptions?: UseMutationOptions<void, Error, void>
): UseMutationResult<void, Error, void> {
  return useMutation<void, Error, void>(() => {
    return batch.commit();
  }, useMutationOptions);
}

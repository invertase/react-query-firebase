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

import * as React from "react";
import { renderHook, act } from "@testing-library/react-hooks";
import {
  collection,
  doc,
  DocumentReference,
  Firestore,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";

import { genId, init } from "./helpers";
import {
  useFirestoreCollectionMutation,
  useFirestoreDocumentDeletion,
  useFirestoreDocumentMutation,
  useFirestoreTransaction,
} from "../src";

describe("useFirestoreMutation", () => {
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let firestore: Firestore;

  beforeEach(() => {
    const config = init();
    wrapper = config.wrapper;
    firestore = config.firestore;
  });

  describe("useFirestoreCollectionMutation", () => {
    test("it adds a document", async () => {
      const ref = collection(firestore, genId());

      const { result, waitFor } = renderHook(
        () => useFirestoreCollectionMutation(ref),
        {
          wrapper,
        }
      );

      act(() => {
        result.current.mutate({ foo: "bar" });
      });

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      const snapshot = await getDocs(ref);

      expect(snapshot.size).toBe(1);
      expect(snapshot.docs[0].data()).toEqual({ foo: "bar" });
    });
  });

  describe("useFirestoreDocumentMutation", () => {
    test("it sets a document", async () => {
      const ref = doc(firestore, genId(), genId());

      await setDoc(ref, { foo: "baz" });

      const { result, waitFor } = renderHook(
        () => useFirestoreDocumentMutation(ref),
        {
          wrapper,
        }
      );

      act(() => {
        result.current.mutate({ foo: "bar" });
      });

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      const snapshot = await getDoc(ref);
      expect(snapshot.data()).toEqual({ foo: "bar" });
    });

    test("it sets a document with merge", async () => {
      const ref = doc(firestore, genId(), genId());

      await setDoc(ref, { foo: "baz" });

      const { result, waitFor } = renderHook(
        () => useFirestoreDocumentMutation(ref, { merge: true }),
        {
          wrapper,
        }
      );

      act(() => {
        result.current.mutate({ bar: "baz" });
      });

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      const snapshot = await getDoc(ref);

      expect(snapshot.data()).toEqual({ foo: "baz", bar: "baz" });
    });
  });

  describe("useFirestoreDocumentDeletion", () => {
    it("deletes a document", async () => {
      const ref = doc(firestore, genId(), genId());

      await setDoc(ref, { foo: "baz" });

      const { result, waitFor } = renderHook(
        () => useFirestoreDocumentDeletion(ref),
        {
          wrapper,
        }
      );

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      const snapshot = await getDoc(ref);

      expect(snapshot.exists).toBe(false);
    });
  });

  describe("useFirestoreTransaction", () => {
    it("transacts a document", async () => {
      const ref = doc(firestore, genId(), genId()) as DocumentReference<Doc>;

      type Doc = {
        foo: number;
      };

      await setDoc(ref, { foo: 10 });
      const mock = jest.fn();
      const { result, waitFor } = renderHook(
        () =>
          useFirestoreTransaction<number>(
            firestore,
            async (tsx) => {
              const doc = await tsx.get(ref);
              const newValue = doc.data().foo + 1;
              tsx.update(ref, { foo: newValue });
              return newValue;
            },
            {
              onSuccess(value) {
                mock(value);
              },
            }
          ),
        {
          wrapper,
        }
      );

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      const snapshot = await getDoc(ref);

      expect(snapshot.data().foo).toBe(11);
      expect(mock.mock.calls[0][0]).toBe(11);
      expect(mock.mock.calls.length).toBe(1);
    });
  });
});

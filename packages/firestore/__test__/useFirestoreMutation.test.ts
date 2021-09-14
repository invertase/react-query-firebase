import React from "react";
import { renderHook, act } from "@testing-library/react-hooks";
import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";

import { genId, init } from "./helpers";
import {
  useFirestoreCollectionMutation,
  useFirestoreDocumentMutation,
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

      await waitFor(() => result.current.isSuccess);

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

      await waitFor(() => result.current.isSuccess);

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

      await waitFor(() => result.current.isSuccess);

      const snapshot = await getDoc(ref);

      expect(snapshot.data()).toEqual({ foo: "baz", bar: "baz" });
    });
  });
});

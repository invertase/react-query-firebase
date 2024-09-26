import React, { type ReactNode } from "react";
import { describe, expect, test, beforeEach } from "vitest";
import { useNamedQuery } from "./useNamedQuery";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  collection,
  addDoc,
  query,
  where,
  DocumentData,
  QuerySnapshot,
} from "firebase/firestore";

import {
  expectFirestoreError,
  firestore,
  wipeFirestore,
} from "~/testing-utils";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useNamedQuery", () => {
  beforeEach(async () => await wipeFirestore());

  test("returns correct data for empty collection", async () => {
    const collectionRef = collection(firestore, "tests");

    const { result } = renderHook(
      () =>
        useNamedQuery(collectionRef, {
          queryKey: ["named", "empty"],
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.empty).toBe(true);
    expect(result.current.data?.docs.length).toBe(0);
  });

  test("returns correct data for non-empty collection", async () => {
    const collectionRef = collection(firestore, "tests");

    await addDoc(collectionRef, { value: 10 });
    await addDoc(collectionRef, { value: 20 });

    const { result } = renderHook(
      () =>
        useNamedQuery(collectionRef, {
          queryKey: ["named", "non-empty"],
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.empty).toBe(false);
    expect(result.current.data?.docs.length).toBe(2);
  });

  test("handles complex queries", async () => {
    const collectionRef = collection(firestore, "tests");

    await addDoc(collectionRef, { category: "A", value: 10 });
    await addDoc(collectionRef, { category: "B", value: 20 });
    await addDoc(collectionRef, { category: "A", value: 30 });

    const complexQuery = query(collectionRef, where("category", "==", "A"));

    const { result } = renderHook(
      () =>
        useNamedQuery(complexQuery, {
          queryKey: ["named", "complex"],
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.empty).toBe(false);
    expect(result.current.data?.docs.length).toBe(2);
  });

  test("handles restricted collections appropriately", async () => {
    const restrictedCollectionRef = collection(
      firestore,
      "restrictedCollection"
    );

    const { result } = renderHook(
      () =>
        useNamedQuery(restrictedCollectionRef, {
          queryKey: ["named", "restricted"],
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expectFirestoreError(result.current.error, "permission-denied");
  });

  test("uses custom transform function", async () => {
    const collectionRef = collection(firestore, "tests");

    await addDoc(collectionRef, { value: 10 });
    await addDoc(collectionRef, { value: 20 });

    const customTransform = (snapshot: QuerySnapshot<DocumentData>) => {
      return snapshot.docs?.map((doc) => doc.data().value);
    };

    const { result } = renderHook(
      () =>
        useNamedQuery<number[]>(collectionRef, {
          queryKey: ["named", "transform"],
          firestore: {
            transform: customTransform,
          },
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result?.current?.data).toEqual([10, 20]);
  });

  test("returns pending state initially", async () => {
    const collectionRef = collection(firestore, "tests");

    await addDoc(collectionRef, { value: 10 });

    const { result } = renderHook(
      () =>
        useNamedQuery(collectionRef, {
          queryKey: ["named", "pending"],
        }),
      { wrapper }
    );

    // Initially isPending should be true
    expect(result.current.isPending).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.empty).toBe(false);
    expect(result.current.data?.docs.length).toBe(1);
  });
});

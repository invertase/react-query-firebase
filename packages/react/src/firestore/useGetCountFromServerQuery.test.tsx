import React, { type ReactNode } from "react";
import { describe, expect, test, beforeEach } from "vitest";
import { useGetCountFromServerQuery } from "./useGetCountFromServerQuery";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { collection, addDoc, query, where } from "firebase/firestore";
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

describe("useGetCountFromServerQuery", () => {
  beforeEach(async () => await wipeFirestore());

  test("returns correct count for empty collection", async () => {
    const collectionRef = collection(firestore, "tests");

    const { result } = renderHook(
      () =>
        useGetCountFromServerQuery(collectionRef, {
          queryKey: ["count", "empty"],
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data().count).toBe(0);
  });

  test("returns correct count for non-empty collection", async () => {
    const collectionRef = collection(firestore, "tests");

    await addDoc(collectionRef, { foo: "bar1" });
    await addDoc(collectionRef, { foo: "bar2" });
    await addDoc(collectionRef, { foo: "bar3" });

    const { result } = renderHook(
      () =>
        useGetCountFromServerQuery(collectionRef, {
          queryKey: ["count", "non-empty"],
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data().count).toBe(3);
  });

  test("handles complex queries", async () => {
    const collectionRef = collection(firestore, "tests");

    await addDoc(collectionRef, { category: "A", value: 1 });
    await addDoc(collectionRef, { category: "B", value: 2 });
    await addDoc(collectionRef, { category: "A", value: 3 });
    await addDoc(collectionRef, { category: "C", value: 4 });

    const complexQuery = query(collectionRef, where("category", "==", "A"));

    const { result } = renderHook(
      () =>
        useGetCountFromServerQuery(complexQuery, {
          queryKey: ["count", "complex"],
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data().count).toBe(2);
  });

  test("handles restricted collections appropriately", async () => {
    const collectionRef = collection(firestore, "restrictedCollection");

    const { result } = renderHook(
      () =>
        useGetCountFromServerQuery(collectionRef, {
          queryKey: ["count", "restricted"],
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expectFirestoreError(result.current.error, "permission-denied");
  });

  test("returns pending state initially", async () => {
    const collectionRef = collection(firestore, "tests");

    await addDoc(collectionRef, { foo: "bar" });

    const { result } = renderHook(
      () =>
        useGetCountFromServerQuery(collectionRef, {
          queryKey: ["count", "pending"],
        }),
      { wrapper }
    );

    // Initially isPending should be true
    expect(result.current.isPending).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.data().count).toBe(1);
  });
});

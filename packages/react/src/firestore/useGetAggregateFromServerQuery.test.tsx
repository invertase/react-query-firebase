import React, { type ReactNode } from "react";
import { describe, expect, test, beforeEach } from "vitest";
import { useGetAggregateFromServerQuery } from "./useGetAggregateFromServerQuery";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  collection,
  addDoc,
  query,
  where,
  sum,
  average,
  count,
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

describe("useGetAggregateFromServerQuery", () => {
  beforeEach(async () => await wipeFirestore());

  test("returns correct count for empty collection", async () => {
    const collectionRef = collection(firestore, "tests");

    const { result } = renderHook(
      () =>
        useGetAggregateFromServerQuery(collectionRef, {
          queryKey: ["aggregate", "empty"],
          firestore: { aggregateSpec: { count: count() } },
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.count).toBe(0);
  });

  test("returns correct aggregate values for non-empty collection", async () => {
    const collectionRef = collection(firestore, "tests");

    await addDoc(collectionRef, { value: 10 });
    await addDoc(collectionRef, { value: 20 });
    await addDoc(collectionRef, { value: 30 });

    const { result } = renderHook(
      () =>
        useGetAggregateFromServerQuery(collectionRef, {
          queryKey: ["aggregate", "non-empty"],
          firestore: {
            aggregateSpec: {
              count: count(),
              sum: sum("value"),
              avg: average("value"),
            },
          },
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.count).toBe(3);
    expect(result.current.data?.sum).toBe(60);
    expect(result.current.data?.avg).toBe(20);
  });

  test("handles complex queries", async () => {
    const collectionRef = collection(firestore, "tests");

    await addDoc(collectionRef, { category: "A", value: 10 });
    await addDoc(collectionRef, { category: "B", value: 20 });
    await addDoc(collectionRef, { category: "A", value: 30 });
    await addDoc(collectionRef, { category: "C", value: 40 });

    const complexQuery = query(collectionRef, where("category", "==", "A"));

    const { result } = renderHook(
      () =>
        useGetAggregateFromServerQuery(complexQuery, {
          queryKey: ["aggregate", "complex"],
          firestore: {
            aggregateSpec: {
              count: count(),
              sum: sum("value"),
              avg: average("value"),
            },
          },
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.count).toBe(2);
    expect(result.current.data?.sum).toBe(40);
    expect(result.current.data?.avg).toBe(20);
  });

  test("handles restricted collections appropriately", async () => {
    const restrictedCollectionRef = collection(
      firestore,
      "restrictedCollection"
    );

    const { result } = renderHook(
      () =>
        useGetAggregateFromServerQuery(restrictedCollectionRef, {
          queryKey: ["aggregate", "restricted"],
          firestore: { aggregateSpec: { count: count() } },
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expectFirestoreError(result.current.error, "permission-denied");
  });

  test("returns pending state initially", async () => {
    const collectionRef = collection(firestore, "tests");

    await addDoc(collectionRef, { value: 10 });

    const { result } = renderHook(
      () =>
        useGetAggregateFromServerQuery(collectionRef, {
          queryKey: ["aggregate", "pending"],
          firestore: { aggregateSpec: { count: count() } },
        }),
      { wrapper }
    );

    // Initially isPending should be true
    expect(result.current.isPending).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.count).toBe(1);
  });
});

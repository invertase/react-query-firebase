import React, { type ReactNode } from "react";
import { describe, expect, test, beforeEach } from "vitest";
import { useCollectionQuery } from "./useCollectionQuery";
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

describe("useCollectionQuery", () => {
  beforeEach(async () => {
    await wipeFirestore();
  });

  test("fetches and returns documents from Firestore collection", async () => {
    const collectionRef = collection(firestore, "tests");

    await addDoc(collectionRef, { foo: "bar1" });
    await addDoc(collectionRef, { foo: "bar2" });

    const { result } = renderHook(
      () =>
        useCollectionQuery(collectionRef, {
          queryKey: ["some", "collection"],
        }),
      { wrapper }
    );

    // in pending state before resolving
    expect(result.current.isPending).toBe(true);
    expect(result.current.status).toBe("pending");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // It should exist and have data.
    expect(result.current.data).toBeDefined();

    const snapshot = result.current.data!;
    expect(snapshot.empty).toBe(false);
    expect(snapshot.size).toBe(2);
    expect(snapshot.docs[0].data().foo).toMatch(/bar[12]/);
    expect(snapshot.docs[1].data().foo).toMatch(/bar[12]/);
  });

  test("fetches collection from server source", async () => {
    const collectionRef = collection(firestore, "tests");

    await addDoc(collectionRef, { foo: "fromServer" });

    const { result } = renderHook(
      () =>
        useCollectionQuery(collectionRef, {
          queryKey: ["server", "collection"],
          firestore: { source: "server" },
        }),
      { wrapper }
    );

    expect(result.current.isPending).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Snapshot should exist, data should be fetched from the server and should contain the correct data
    const snapshot = result.current.data;
    expect(snapshot?.empty).toBe(false);
    expect(snapshot?.size).toBe(1);
    expect(snapshot?.docs[0].data().foo).toBe("fromServer");
  });

  test("handles restricted collections appropriately", async () => {
    const restrictedCollectionRef = collection(
      firestore,
      "restrictedCollection"
    );

    const { result } = renderHook(
      () =>
        useCollectionQuery(restrictedCollectionRef, {
          queryKey: ["restricted", "collection"],
        }),
      { wrapper }
    );

    expect(result.current.isPending).toBe(true);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expectFirestoreError(result.current.error, "permission-denied");
  });

  test("returns pending state initially", async () => {
    const collectionRef = collection(firestore, "tests");

    await addDoc(collectionRef, { foo: "pending" });

    const { result } = renderHook(
      () =>
        useCollectionQuery(collectionRef, {
          queryKey: ["pending", "state"],
        }),
      { wrapper }
    );

    // Initially isPending should be true
    expect(result.current.isPending).toBe(true);

    // Wait for the query to finish, and should have isSuccess true
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const snapshot = result.current.data;
    expect(snapshot?.empty).toBe(false);
    expect(snapshot?.size).toBe(1);
    expect(snapshot?.docs[0].data().foo).toBe("pending");
  });

  test("returns correct data type", async () => {
    const collectionRef = collection(firestore, "tests");

    await addDoc(collectionRef, { foo: "bar", num: 23 });

    const { result } = renderHook(
      () =>
        useCollectionQuery(collectionRef, {
          queryKey: ["typed", "collection"],
        }),
      { wrapper }
    );

    expect(result.current.isPending).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const snapshot = result.current.data;
    expect(snapshot?.empty).toBe(false);
    expect(snapshot?.size).toBe(1);
    const doc = snapshot?.docs[0];
    expect(doc?.data().foo).toBe("bar");
    expect(doc?.data().num).toBe(23);
  });

  test("handles complex queries", async () => {
    const collectionRef = collection(firestore, "tests");

    await addDoc(collectionRef, { category: "A", value: 1 });
    await addDoc(collectionRef, { category: "B", value: 2 });
    await addDoc(collectionRef, { category: "A", value: 3 });

    const complexQuery = query(collectionRef, where("category", "==", "A"));

    const { result } = renderHook(
      () =>
        useCollectionQuery(complexQuery, {
          queryKey: ["complex", "query"],
        }),
      { wrapper }
    );

    expect(result.current.isPending).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const snapshot = result.current.data;
    expect(snapshot?.size).toBe(2);
    snapshot?.forEach((doc) => {
      expect(doc.data().category).toBe("A");
    });
  });
});

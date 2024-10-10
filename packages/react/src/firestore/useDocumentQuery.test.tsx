import React, { type ReactNode } from "react";
import { describe, expect, test, beforeEach } from "vitest";
import { useDocumentQuery } from "./useDocumentQuery";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { doc, setDoc } from "firebase/firestore";

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

describe("useDocumentQuery", () => {
  beforeEach(async () => {
    await wipeFirestore();
  });

  test("it works", async () => {
    const ref = doc(firestore, "tests", "useDocumentQuery");

    // Set some data
    await setDoc(ref, { foo: "bar" });

    // Test the hook
    const { result } = renderHook(
      () =>
        useDocumentQuery(ref, {
          queryKey: ["some", "doc"],
        }),
      { wrapper }
    );

    // Wait for the query to finish
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // It shoiuld exist and have data.
    expect(result.current.data).toBeDefined();

    const snapshot = result.current.data!;
    expect(snapshot.exists()).toBe(true);
    expect(snapshot.data()?.foo).toBe("bar");
  });

  test("fetches document from server source", async () => {
    const ref = doc(firestore, "tests", "serverSource");

    // set data
    await setDoc(ref, { foo: "fromServer" });

    //test the hook
    const { result } = renderHook(
      () =>
        useDocumentQuery(ref, {
          queryKey: ["server", "doc"],
          firestore: { source: "server" },
        }),
      { wrapper }
    );

    // await the query
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // snapshot should exist, data should be fetched from the server and should contain the correct data
    const snapshot = result.current.data;
    expect(snapshot?.exists()).toBe(true);
    expect(snapshot?.data()?.foo).toBe("fromServer");
  });

  test("handles restricted collections appropriately", async () => {
    const ref = doc(firestore, "restrictedCollection", "someDoc");

    const { result } = renderHook(
      () =>
        useDocumentQuery(ref, {
          queryKey: ["restricted", "doc"],
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expectFirestoreError(result.current.error, "permission-denied");
  });

  test("returns pending state initially", async () => {
    const ref = doc(firestore, "tests", "pendingState");

    setDoc(ref, { foo: "pending" });

    const { result } = renderHook(
      () =>
        useDocumentQuery(ref, {
          queryKey: ["pending", "state"],
        }),
      { wrapper }
    );

    // initially isPending should be true
    expect(result.current.isPending).toBe(true);

    // wait for the query to finish, and should have isSuccess true
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const snapshot = result.current.data;
    expect(snapshot?.exists()).toBe(true);
    expect(snapshot?.data()?.foo).toBe("pending");
  });

  test("returns correct data type", async () => {
    const ref = doc(firestore, "tests", "typedDoc");

    setDoc(ref, { foo: "bar", num: 23 } as { foo: string; num: number });

    const { result } = renderHook(
      () =>
        useDocumentQuery(ref, {
          queryKey: ["typed", "doc"],
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const snapshot = result.current.data;
    expect(snapshot?.exists()).toBe(true);
    expect(snapshot?.data()?.foo).toBe("bar");
    expect(snapshot?.data()?.num).toBe(23);
  });
});

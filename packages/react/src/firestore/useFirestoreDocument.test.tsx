import React, { type ReactNode } from "react";
import { describe, expect, test, beforeEach } from "vitest";
import { useFirestoreDocument } from "./useFirestoreDocument";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { doc, setDoc } from "firebase/firestore";

import { firestore, wipeFirestore } from "~/testing-utils";

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

describe("useFirestoreDocument", () => {
  beforeEach(async () => {
    await wipeFirestore();
  });

  test("it works", async () => {
    const ref = doc(firestore, "tests", "useFirestoreDocument");

    // Set some data
    await setDoc(ref, { foo: "bar" });

    // Test the hook
    const { result } = renderHook(
      () =>
        useFirestoreDocument(ref, {
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
        useFirestoreDocument(ref, {
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
});

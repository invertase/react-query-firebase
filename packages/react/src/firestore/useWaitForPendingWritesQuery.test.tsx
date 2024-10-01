import React from "react";
import { describe, expect, test, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  expectFirestoreError,
  firestore,
  wipeFirestore,
} from "~/testing-utils";
import { useWaitForPendingWritesQuery } from "./useWaitForPendingWritesQuery";
import { doc, setDoc } from "firebase/firestore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useWaitForPendingWritesQuery", () => {
  beforeEach(async () => {
    queryClient.clear();
    await wipeFirestore();
  });

  test("enters loading state when pending writes are in progress", async () => {
    const docRef = doc(firestore, "tests", "loadingStateDoc");

    const { result } = renderHook(
      () =>
        useWaitForPendingWritesQuery(firestore, {
          queryKey: ["pending", "write", "loading"],
        }),
      { wrapper }
    );

    // Initiate a write without an await
    setDoc(docRef, { value: "loading-test" });

    expect(result.current.isPending).toBe(true);
  });
});

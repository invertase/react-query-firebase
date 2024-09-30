import React from "react";
import { describe, expect, test, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { firestore, wipeFirestore } from "~/testing-utils";
import { useWriteBatchCommitMutation } from "./useWriteBatchCommitMutation";
import { doc, getDoc } from "firebase/firestore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useWriteBatchCommitMutation", () => {
  beforeEach(async () => {
    queryClient.clear();
    await wipeFirestore();
  });

  test("successfully creates and commits a write batch", async () => {
    const docRef1 = doc(firestore, "tests", "doc1");
    const docRef2 = doc(firestore, "tests", "doc2");

    const { result } = renderHook(
      () => useWriteBatchCommitMutation(firestore),
      {
        wrapper,
      }
    );

    act(async () => {
      const batch = await result.current.mutateAsync();
      batch.set(docRef1, { value: "test1" });
      batch.set(docRef2, { value: "test2" });
      await batch.commit();
    });

    await waitFor(async () => {
      const doc1Snapshot = await getDoc(docRef1);
      const doc2Snapshot = await getDoc(docRef2);

      expect(doc1Snapshot.exists()).toBe(true);
      expect(doc2Snapshot.exists()).toBe(true);

      expect(doc1Snapshot.data()).toEqual({ value: "test1" });
      expect(doc2Snapshot.data()).toEqual({ value: "test2" });
    });
  });
});

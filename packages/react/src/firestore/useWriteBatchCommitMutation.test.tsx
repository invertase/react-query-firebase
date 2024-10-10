import React from "react";
import { describe, expect, test, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { firestore, wipeFirestore } from "~/testing-utils";
import { useWriteBatchCommitMutation } from "./useWriteBatchCommitMutation";
import { doc, getDoc, setDoc, writeBatch } from "firebase/firestore";

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

    const { result } = renderHook(() => useWriteBatchCommitMutation(), {
      wrapper,
    });

    await act(async () => {
      const batch = writeBatch(firestore);
      batch.set(docRef1, { value: "test1" });
      batch.set(docRef2, { value: "test2" });
      await result.current.mutate(batch);
    });

    const doc1Snapshot = await getDoc(docRef1);
    const doc2Snapshot = await getDoc(docRef2);

    await waitFor(async () => {
      expect(doc1Snapshot.exists()).toBe(true);
      expect(doc2Snapshot.exists()).toBe(true);

      expect(doc1Snapshot.data()).toEqual({ value: "test1" });
      expect(doc2Snapshot.data()).toEqual({ value: "test2" });
    });
  });

  test("handles multiple operations in a single batch", async () => {
    const docRef1 = doc(firestore, "tests", "doc1");
    const docRef2 = doc(firestore, "tests", "doc2");
    const docRef3 = doc(firestore, "tests", "doc3");

    const { result } = renderHook(() => useWriteBatchCommitMutation(), {
      wrapper,
    });

    await setDoc(docRef1, { value: "initial1" });
    await setDoc(docRef2, { value: "initial2" });

    await act(async () => {
      const batch = writeBatch(firestore);
      batch.update(docRef1, { value: "updated1" });
      batch.update(docRef1, { value: "updated1" });
      batch.delete(docRef2);
      batch.set(docRef3, { value: "new3" });
      await result.current.mutate(batch);
    });

    const doc1Snapshot = await getDoc(docRef1);
    const doc2Snapshot = await getDoc(docRef2);
    const doc3Snapshot = await getDoc(docRef3);

    await waitFor(async () => {
      expect(doc1Snapshot.data()).toEqual({ value: "updated1" });
      expect(doc2Snapshot.exists()).toBe(false);
      expect(doc3Snapshot.data()).toEqual({ value: "new3" });
    });
  });

  test("successfully creates and commits a write batch with nested fields", async () => {
    const docRef1 = doc(firestore, "tests", "doc1");
    const docRef2 = doc(firestore, "tests", "doc2");

    await setDoc(docRef1, {
      fieldToUpdate: { nestedField: "value" },
    });

    const { result } = renderHook(() => useWriteBatchCommitMutation(), {
      wrapper,
    });

    await act(async () => {
      const batch = writeBatch(firestore);

      batch.set(docRef2, { value: "test2" });
      batch.update(docRef1, { "fieldToUpdate.nestedField": "newValue" });
      await result.current.mutate(batch);
    });

    const doc1Snapshot = await getDoc(docRef1);
    const doc2Snapshot = await getDoc(docRef2);

    await waitFor(async () => {
      expect(doc1Snapshot.exists()).toBe(true);
      expect(doc2Snapshot.exists()).toBe(true);

      expect(doc1Snapshot.data()).toEqual({
        fieldToUpdate: { nestedField: "newValue" },
      });
      expect(doc2Snapshot.data()).toEqual({
        value: "test2",
      });
    });
  });
});

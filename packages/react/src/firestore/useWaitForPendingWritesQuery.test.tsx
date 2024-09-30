import React from "react";
import { describe, expect, test, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { firestore, wipeFirestore } from "~/testing-utils";
import { useWaitForPendingWritesQuery } from "./useWaitForPendingWritesQuery";
import { doc, getDoc, setDoc } from "firebase/firestore";

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

  test("waits for pending writes to complete successfully", async () => {
    const docRef = doc(firestore, "tests", "waitForPendingWritesDoc");

    // Verify that the document doesn't exist initially
    const initialDocSnapshot = await getDoc(docRef);
    expect(initialDocSnapshot.exists()).toBe(false);

    const { result } = renderHook(
      () => useWaitForPendingWritesQuery(firestore),
      {
        wrapper,
      }
    );

    await setDoc(docRef, { value: "test" });

    await act(() => result.current.mutate());

    // Verify that the write has been acknowledged
    await waitFor(async () => {
      const docSnapshot = await getDoc(docRef);
      expect(docSnapshot.exists()).toBe(true);
      expect(docSnapshot.data()).toEqual({ value: "test" });
    });

    expect(result.current.isSuccess).toBe(true);
  });

  test("calls onSuccess callback after mutation", async () => {
    const docRef = doc(firestore, "tests", "docOnSuccess");
    const onSuccessMock = vi.fn();

    const { result } = renderHook(
      () =>
        useWaitForPendingWritesQuery(firestore, {
          onSuccess: onSuccessMock,
        }),
      {
        wrapper,
      }
    );

    await setDoc(docRef, { value: "success test" });

    await act(() => result.current.mutate());

    expect(onSuccessMock).toHaveBeenCalled();
  });

  test("handles multiple pending writes successfully", async () => {
    const docRef1 = doc(firestore, "tests", "docMulti1");
    const docRef2 = doc(firestore, "tests", "docMulti2");

    const { result } = renderHook(
      () => useWaitForPendingWritesQuery(firestore),
      {
        wrapper,
      }
    );

    // Perform multiple Firestore writes
    await setDoc(docRef1, { value: "multi write 1" });
    await setDoc(docRef2, { value: "multi write 2" });

    await act(() => result.current.mutate());

    await waitFor(async () => {
      const doc1Snapshot = await getDoc(docRef1);
      const doc2Snapshot = await getDoc(docRef2);

      expect(doc1Snapshot.exists()).toBe(true);
      expect(doc1Snapshot.data()).toEqual({ value: "multi write 1" });

      expect(doc2Snapshot.exists()).toBe(true);
      expect(doc2Snapshot.data()).toEqual({ value: "multi write 2" });
    });
  });
});

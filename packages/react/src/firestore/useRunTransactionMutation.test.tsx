import React from "react";
import { describe, expect, test, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { firestore, wipeFirestore } from "~/testing-utils";
import { useRunTransactionMutation } from "./useRunTransactionMutation";
import { doc, getDoc, setDoc, type Transaction } from "firebase/firestore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useRunTransactionMutation", () => {
  beforeEach(async () => {
    queryClient.clear();
    await wipeFirestore();
  });

  test("should successfully perform a transaction and update a Firestore document", async () => {
    const docRef = doc(firestore, "tests", "transactionDoc");
    await setDoc(docRef, { foo: "bar" });

    const updateFunction = async (transaction: Transaction) => {
      transaction.set(docRef, { foo: "updatedDoc" });
    };

    const { result } = renderHook(
      () => useRunTransactionMutation(firestore, updateFunction),
      { wrapper }
    );

    await act(() => result.current.mutate());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify the document was actually updated
    const docSnapshot = await getDoc(docRef);
    expect(docSnapshot.exists()).toBe(true);
    expect(docSnapshot.data()).toEqual({ foo: "updatedDoc" });
  });

  test("should perform a transaction with options and update a Firestore document", async () => {
    const docRef = doc(firestore, "tests", "transactionDoc");

    await setDoc(docRef, { foo: "bar" });

    const updateFunction = async (transaction: Transaction) => {
      transaction.set(docRef, { foo: "updatedWithOptions" });
    };

    const { result } = renderHook(
      () =>
        useRunTransactionMutation(firestore, updateFunction, {
          firestore: { maxAttempts: 1 },
        }),
      { wrapper }
    );

    await act(() => result.current.mutate());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const docSnapshot = await getDoc(docRef);
    expect(docSnapshot.exists()).toBe(true);
    expect(docSnapshot.data()).toEqual({ foo: "updatedWithOptions" });
  });

  test("should handle transaction errors correctly", async () => {
    const updateFunction = async () => {
      throw new Error("Transaction failed");
    };

    const { result } = renderHook(
      () => useRunTransactionMutation(firestore, updateFunction),
      { wrapper }
    );

    await act(() => result.current.mutate());

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.isError).toBe(true);
    expect(result.current.error?.message).toBe("Transaction failed");
  });

  test("should call onSuccess callback when transaction is successful", async () => {
    const updateFunction = async (transaction: Transaction) => {
      const docRef = doc(firestore, "tests", "transactionDoc");
      transaction.set(docRef, { foo: "onSuccessTest" });
      return "Success";
    };

    const onSuccessMock = vi.fn();

    const { result } = renderHook(
      () =>
        useRunTransactionMutation(firestore, updateFunction, {
          onSuccess: onSuccessMock,
        }),
      { wrapper }
    );

    await act(() => result.current.mutate());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(onSuccessMock).toHaveBeenCalled();
  });

  test("should call onError callback when transaction fails", async () => {
    const updateFunction = async () => {
      throw new Error("Transaction failed");
    };

    const onErrorMock = vi.fn();

    const { result } = renderHook(
      () =>
        useRunTransactionMutation(firestore, updateFunction, {
          onError: onErrorMock,
        }),
      { wrapper }
    );

    await act(() => result.current.mutate());

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(onErrorMock).toHaveBeenCalled();
  });
});

import React from "react";
import { describe, expect, test, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  expectFirestoreError,
  firestore,
  wipeFirestore,
} from "~/testing-utils";
import { useEnableNetworkMutation } from "./useEnableNetworkMutation";
import {
  doc,
  getDoc,
  disableNetwork,
  setDoc,
  enableNetwork,
} from "firebase/firestore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useEnableNetworkMutation", () => {
  beforeEach(async () => {
    queryClient.clear();
    await disableNetwork(firestore);
    await wipeFirestore();
  });

  test("should successfully enable the Firestore network", async () => {
    const { result } = renderHook(() => useEnableNetworkMutation(firestore), {
      wrapper,
    });

    await act(() => result.current.mutate());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify that network operations successfully execute
    const docRef = doc(firestore, "tests", "enabledNetwork");
    await setDoc(docRef, { foo: "bar" });

    try {
      const snapshot = await getDoc(docRef);
      expect(snapshot?.exists()).toBe(true);
      expect(snapshot?.data()?.foo).toBe("bar");
    } catch (error) {
      expectFirestoreError(error, "unavailable");
    }
  });

  test("should correctly reset mutation state after operations", async () => {
    const { result } = renderHook(() => useEnableNetworkMutation(firestore), {
      wrapper,
    });

    await act(() => result.current.mutate());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    act(() => result.current.reset());

    await waitFor(() => {
      expect(result.current.isIdle).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();
    });
  });

  test("should work correctly when network is already enabled", async () => {
    await enableNetwork(firestore);

    const { result } = renderHook(() => useEnableNetworkMutation(firestore), {
      wrapper,
    });

    await act(() => result.current.mutate());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify that network operations successfully execute
    const docRef = doc(firestore, "tests", "alreadyEnabledNetwork");
    await setDoc(docRef, { foo: "bar" });

    try {
      const snapshot = await getDoc(docRef);
      expect(snapshot?.exists()).toBe(true);
      expect(snapshot?.data()?.foo).toBe("bar");
    } catch (error) {
      expectFirestoreError(error, "unavailable");
    }
  });
});

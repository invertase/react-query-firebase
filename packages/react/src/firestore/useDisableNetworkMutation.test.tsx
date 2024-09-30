import React from "react";
import { describe, expect, test, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  expectFirestoreError,
  firestore,
  wipeFirestore,
} from "~/testing-utils";
import { useDisableNetworkMutation } from "./useDisableNetworkMutation";
import { doc, getDoc, enableNetwork, disableNetwork } from "firebase/firestore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useDisableNetworkMutation", () => {
  beforeEach(async () => {
    queryClient.clear();
    await enableNetwork(firestore);
    await wipeFirestore();
  });

  test("should successfully disable the Firestore network", async () => {
    const { result } = renderHook(() => useDisableNetworkMutation(firestore), {
      wrapper,
    });

    await act(() => result.current.mutate());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify that network operations fail
    const docRef = doc(firestore, "tests", "someDoc");
    try {
      await getDoc(docRef);
      throw new Error(
        "Expected the network to be disabled, but Firestore operation succeeded."
      );
    } catch (error) {
      expectFirestoreError(error, "unavailable");
    }
  });
});

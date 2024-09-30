import React from "react";
import { describe, expect, test, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { firestore, wipeFirestore } from "~/testing-utils";
import { useClearIndexedDbPersistenceMutation } from "./useClearIndexedDbPersistenceMutation";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useClearIndexedDbPersistenceMutation", () => {
  beforeEach(async () => {
    queryClient.clear();
    await wipeFirestore();
  });

  test("should successfully clear IndexedDB persistence", async () => {
    const { result } = renderHook(
      () => useClearIndexedDbPersistenceMutation(firestore),
      {
        wrapper,
      }
    );

    await act(() => result.current.mutate());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
    expect(result.current.isPending).toBe(false);
  });

  test("should respect custom options passed to the hook", async () => {
    const onSuccessMock = vi.fn();
    const onErrorMock = vi.fn();

    const { result } = renderHook(
      () =>
        useClearIndexedDbPersistenceMutation(firestore, {
          onSuccess: onSuccessMock,
          onError: onErrorMock,
        }),
      { wrapper }
    );

    await act(() => result.current.mutate());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onSuccessMock).toHaveBeenCalled();
    expect(onErrorMock).not.toHaveBeenCalled();
  });

  test("should correctly reset mutation state after operations", async () => {
    const { result } = renderHook(
      () => useClearIndexedDbPersistenceMutation(firestore),
      {
        wrapper,
      }
    );

    await act(() => result.current.mutate());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    act(() => result.current.reset());

    await waitFor(() => {
      expect(result.current.isIdle).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();
    });
  });
});

import React from "react";
import { describe, expect, test, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type Auth, type UserCredential } from "firebase/auth";
import { useSignInAnonymouslyMutation } from "./useSignInAnonymouslyMutation";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useSignInAnonymously", () => {
  let auth: Auth;

  beforeEach(() => {
  });

  test("successfully signs in anonymously", async () => {
    const { result } = renderHook(() => useSignInAnonymouslyMutation(auth), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.user.isAnonymous).toBe(true);
  });

  test("handles auth error", async () => {
    const { result } = renderHook(() => useSignInAnonymouslyMutation(auth), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // expect(result.current.error).toEqual(mockError);
  });

  test("returns pending state initially", async () => {
    const { result } = renderHook(() => useSignInAnonymouslyMutation(auth), {
      wrapper,
    });

    // Initially, it should be idle
    expect(result.current.isIdle).toBe(true);

    act(() => {
      result.current.mutate();
    });

    // After mutate is called, it should be loading
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    // Once the request is resolved, it should be successful
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

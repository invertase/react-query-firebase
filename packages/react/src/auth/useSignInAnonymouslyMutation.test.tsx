import React from "react";
import {
  describe,
  expect,
  test,
  beforeEach,
  vi,
  type MockInstance,
} from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  type Auth,
  type UserCredential,
  signInAnonymously,
} from "firebase/auth";
import { useSignInAnonymouslyMutation } from "./useSignInAnonymouslyMutation";

vi.mock("firebase/auth", () => ({
  signInAnonymously: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useSignInAnonymouslyMutation", () => {
  let auth: Auth;
  let mockSignInAnonymously: MockInstance;

  beforeEach(() => {
    queryClient.clear();
    auth = {} as Auth;
    mockSignInAnonymously = vi.mocked(signInAnonymously);
    vi.clearAllMocks();
  });

  test("successfully signs in anonymously", async () => {
    const mockUserCredential: UserCredential = {
      user: { isAnonymous: true } as any,
    } as UserCredential;
    mockSignInAnonymously.mockResolvedValue(mockUserCredential);

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
    expect(mockSignInAnonymously).toHaveBeenCalledWith(auth);
  });

  test("handles sign-in error", async () => {
    const mockError = new Error("Sign-in failed");
    mockSignInAnonymously.mockRejectedValue(mockError);

    const { result } = renderHook(() => useSignInAnonymouslyMutation(auth), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });

  test("goes through correct states when signing in anonymously", async () => {
    const mockUserCredential: UserCredential = {
      user: { isAnonymous: true } as any,
    } as UserCredential;

    let resolveSignIn: (value: UserCredential) => void;
    const signInPromise = new Promise<UserCredential>((resolve) => {
      resolveSignIn = resolve;
    });

    mockSignInAnonymously.mockReturnValue(signInPromise);

    const { result } = renderHook(() => useSignInAnonymouslyMutation(auth), {
      wrapper,
    });

    // Initially, it should be idle
    expect(result.current.status).toBe("idle");
    expect(result.current.isIdle).toBe(true);

    act(() => {
      result.current.mutate();
    });

    // Immediately after calling mutate, it should be pending
    await waitFor(() => {
      expect(result.current.status).toBe("pending");
      expect(result.current.isPending).toBe(true);
    });

    // Resolve the sign-in promise
    act(() => {
      resolveSignIn(mockUserCredential);
    });

    // Finally, it should be success
    await waitFor(() => {
      expect(result.current.status).toBe("success");
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data?.user.isAnonymous).toBe(true);
    });

    expect(mockSignInAnonymously).toHaveBeenCalledWith(auth);
  });

  test("can be called multiple times", async () => {
    const mockUserCredential: UserCredential = {
      user: { isAnonymous: true } as any,
    } as UserCredential;
    mockSignInAnonymously.mockResolvedValue(mockUserCredential);

    const { result } = renderHook(() => useSignInAnonymouslyMutation(auth), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate();
    });

    await act(async () => {
      result.current.mutate();
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.user.isAnonymous).toBe(true);
    expect(mockSignInAnonymously).toHaveBeenCalledTimes(3);
  });

  test("resets mutation state correctly", async () => {
    const mockUserCredential: UserCredential = {
      user: { isAnonymous: true },
    } as UserCredential;
    mockSignInAnonymously.mockResolvedValue(mockUserCredential);

    const { result } = renderHook(() => useSignInAnonymouslyMutation(auth), {
      wrapper,
    });

    act(() => {
      result.current.mutateAsync();
    });

    await waitFor(() => {
      expect(result.current.data?.user.isAnonymous).toBe(true);
      expect(result.current.isSuccess).toBe(true);
    });

    act(() => {
      result.current.reset();
    });

    await waitFor(() => {
      expect(result.current.isIdle).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();
    });

    expect(mockSignInAnonymously).toHaveBeenCalledOnce();
  });
});

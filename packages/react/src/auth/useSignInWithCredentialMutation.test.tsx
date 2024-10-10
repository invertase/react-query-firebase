import React from "react";
import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSignInWithCredentialMutation } from "./useSignInWithCredentialMutation";
import { auth, expectFirebaseError, wipeAuth } from "~/testing-utils";
import { GoogleAuthProvider } from "firebase/auth";
import jwt from "jsonwebtoken";

const secret = "something-secret";
const payload = {
  email: "tanstack-query-firebase@invertase.io",
  sub: "tanstack-query-firebase",
};

const mockIdToken = jwt.sign(payload, secret, { expiresIn: "1h" });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useSignInWithCredentialMutation", () => {
  beforeEach(async () => {
    queryClient.clear();
    await wipeAuth();
  });

  afterEach(async () => {
    await auth.signOut();
  });

  const credential = GoogleAuthProvider.credential(mockIdToken);

  test("successfully signs in with credentials", async () => {
    const { result } = renderHook(
      () => useSignInWithCredentialMutation(auth, credential),
      { wrapper }
    );

    act(() => result.current.mutate());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveProperty("user");
    expect(result.current.data?.user).toHaveProperty("uid");
    expect(result.current.data?.user).toHaveProperty("email");
    expect(result.current.data?.user.email).toBe(
      "tanstack-query-firebase@invertase.io"
    );
    expect(result.current.data?.user.isAnonymous).toBe(false);
  });

  test("handles sign-in error with invalid credential", async () => {
    const invalidCredential = GoogleAuthProvider.credential("invalid-token");

    const { result } = renderHook(
      () => useSignInWithCredentialMutation(auth, invalidCredential),
      { wrapper }
    );

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expectFirebaseError(result.current.error, "auth/invalid-credential");
  });

  test("resets mutation state correctly", async () => {
    const { result } = renderHook(
      () => useSignInWithCredentialMutation(auth, credential),
      { wrapper }
    );

    act(() => result.current.mutate());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBeDefined();
    });

    act(() => {
      result.current.reset();
    });

    await waitFor(() => {
      expect(result.current.isIdle).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();
    });
  });

  test("allows multiple sequential sign-ins", async () => {
    const { result } = renderHook(
      () => useSignInWithCredentialMutation(auth, credential),
      { wrapper }
    );

    // First sign-in
    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Reset state
    act(() => result.current.reset());
    await waitFor(() => expect(result.current.isIdle).toBe(true));

    // Second sign-in
    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  test("handles concurrent sign-in attempts", async () => {
    const { result } = renderHook(
      () => useSignInWithCredentialMutation(auth, credential),
      { wrapper }
    );

    const promise1 = act(() => result.current.mutate());
    const promise2 = act(() => result.current.mutate());

    await Promise.all([promise1, promise2]);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.user.email).toBe(
      "tanstack-query-firebase@invertase.io"
    );
  });

  test("respects custom mutation options", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useSignInWithCredentialMutation(auth, credential, {
          onSuccess,
          onError,
        }),
      { wrapper }
    );

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(onSuccess).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});

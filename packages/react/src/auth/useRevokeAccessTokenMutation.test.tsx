import React from "react";
import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRevokeAccessTokenMutation } from "./useRevokeAccessTokenMutation";
import {
  OAuthProvider,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import { auth, wipeAuth } from "~/testing-utils";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useRevokeAccessTokenMutation", () => {
  let userCredential: UserCredential;

  beforeEach(async () => {
    const provider = new OAuthProvider("apple.com");
    userCredential = await signInWithPopup(auth, provider);
  });

  afterEach(async () => {
    queryClient.clear();
    await auth.signOut();
    await wipeAuth();
  });

  test("successfully revokes access token", async () => {
    const { result } = renderHook(() => useRevokeAccessTokenMutation(auth), {
      wrapper,
    });

    const oauthAccessToken = await userCredential.user.getIdToken();
  });
});

import React from "react";
import { QueryClient } from "react-query";
import { renderHook, act } from "@testing-library/react-hooks";
import { Auth } from "firebase/auth";
import { genId, init } from "./helpers";
import { useAuthUser } from "../src";

describe("useFirestoreQuery", () => {
  let client: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let auth: Auth;

  beforeEach(() => {
    const config = init();
    client = config.client;
    wrapper = config.wrapper;
    auth = config.auth;
  });

  afterEach(async () => {
    client.clear();
    await auth.signOut();
  });

  describe("useFirestoreQuery", () => {
    test("it returns null when not signed in", async () => {
      const hookId = genId();

      const { result, waitFor } = renderHook(() => useAuthUser(hookId, auth), {
        wrapper,
      });

      // Query is not enabled yet
      expect(result.current.isIdle).toBe(true);

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeNull();
    });
  });
});

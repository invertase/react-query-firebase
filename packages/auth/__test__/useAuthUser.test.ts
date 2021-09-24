import React from "react";
import { QueryClient } from "react-query";
import { renderHook, act } from "@testing-library/react-hooks";
import { Auth, UserCredential } from "firebase/auth";
import { genId, init, signIn } from "./helpers";
import { useAuthIdToken, useAuthUser } from "../src";

xdescribe("Authentication", () => {
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
    try {
      await auth.signOut();
    } catch {
      // No user to sign out
    }
  });

  describe("useAuthUser", () => {
    test("it returns null when not signed in", async () => {
      const hookId = genId();

      const { result, waitFor } = renderHook(() => useAuthUser(hookId, auth), {
        wrapper,
      });

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeNull();
    });

    test("it returns a User when signed in", async () => {
      const hookId = genId();
      const credential = await signIn(auth);

      const { result, waitFor } = renderHook(() => useAuthUser(hookId, auth), {
        wrapper,
      });

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeDefined();
      expect(result.current.data.uid).toBe(credential.user.uid);
    });

    test("subscribes to state changes", async () => {
      const hookId = genId();

      const { result, waitFor } = renderHook(() => useAuthUser(hookId, auth), {
        wrapper,
      });

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeNull();

      let credential: UserCredential;
      await act(async () => {
        credential = await signIn(auth);
      });

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data.uid).toBe(credential.user.uid);
    });

    test("unsubscribes from state changes", async () => {
      const hookId = genId();
      const mock = jest.fn();

      const { result, waitFor, unmount } = renderHook(
        () =>
          useAuthUser(hookId, auth, {
            onSuccess(user) {
              mock(user);
              return user;
            },
          }),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeNull();

      // Unmount and stop subscribing
      unmount();

      await act(async () => {
        await signIn(auth);
      });

      expect(mock.mock.calls.length).toBe(1);
    });

    test("resubscribes on key change", async () => {
      const hookId1 = genId();
      const hookId2 = genId();
      const mock = jest.fn();

      const { result, waitFor, rerender } = renderHook<
        {
          id: string;
        },
        any
      >(
        ({ id }) =>
          useAuthUser(id, auth, {
            onSuccess(user) {
              mock(user);
              return user;
            },
          }),
        {
          wrapper: (props) => wrapper({ children: props.children }),
          initialProps: {
            id: hookId1,
          },
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeNull();

      rerender({ id: hookId2 });

      await waitFor(() => result.current.isSuccess);

      expect(mock.mock.calls.length).toBe(2);
    });
  });

  describe("useAuthIdToken", () => {
    test("it returns null when not signed in", async () => {
      const hookId = genId();

      const { result, waitFor } = renderHook(
        () => useAuthIdToken(hookId, auth),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeNull();
    });

    test("it returns a IdTokenResult when signed in", async () => {
      const hookId = genId();
      await signIn(auth);

      const { result, waitFor } = renderHook(
        () => useAuthIdToken(hookId, auth),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeDefined();
      expect(result.current.data.token).toBeDefined();
    });

    test("subscribes to state changes", async () => {
      const hookId = genId();

      const { result, waitFor } = renderHook(
        () => useAuthIdToken(hookId, auth),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeNull();

      await act(async () => {
        await signIn(auth);
      });

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeDefined();
      expect(result.current.data.token).toBeDefined();
    });

    test("unsubscribes from state changes", async () => {
      const hookId = genId();
      const mock = jest.fn();

      const { result, waitFor, unmount } = renderHook(
        () =>
          useAuthIdToken(hookId, auth, undefined, {
            onSuccess(user) {
              mock(user);
              return user;
            },
          }),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeNull();

      // Unmount and stop subscribing
      unmount();

      await act(async () => {
        await signIn(auth);
      });

      expect(mock.mock.calls.length).toBe(1);
    });

    test("resubscribes on key change", async () => {
      const hookId1 = genId();
      const hookId2 = genId();
      const mock = jest.fn();

      const { result, waitFor, rerender } = renderHook<
        {
          id: string;
        },
        any
      >(
        ({ id }) =>
          useAuthIdToken(id, auth, undefined, {
            onSuccess(user) {
              mock(user);
              return user;
            },
          }),
        {
          wrapper: (props) => wrapper({ children: props.children }),
          initialProps: {
            id: hookId1,
          },
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeNull();

      rerender({ id: hookId2 });

      await waitFor(() => result.current.isSuccess);

      expect(mock.mock.calls.length).toBe(2);
    });
  });
});

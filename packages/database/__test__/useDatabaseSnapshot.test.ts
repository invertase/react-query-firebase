import React from "react";
import { QueryClient } from "react-query";
import { renderHook } from "@testing-library/react-hooks";
import { genId, init } from "./helpers";
import { useDatabaseSnapshot, useDatabaseValue } from "../src";
import { act } from "react-test-renderer";
import {
  Database,
  DataSnapshot,
  ref,
  remove,
  set,
  update,
} from "@firebase/database";
import { push } from "firebase/database";

describe("Database", () => {
  let client: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let database: Database;

  beforeEach(() => {
    const config = init();
    client = config.client;
    wrapper = config.wrapper;
    database = config.database;
  });

  afterEach(async () => {
    client.clear();
  });

  describe("useDatabaseSnapshot", () => {
    test("it returns a valid snapshot", async () => {
      const hookId = genId();
      const dbRef = ref(database, "foo");

      const { result, waitFor } = renderHook(
        () => useDatabaseSnapshot(hookId, dbRef),
        {
          wrapper,
        },
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeInstanceOf(DataSnapshot);
      expect(result.current.data.exists()).toBe(false);
    });

    test("it returns a valid snapshot with data", async () => {
      const hookId = genId();
      const dbRef = ref(database, genId());

      await set(dbRef, { foo: "bar" });

      const { result, waitFor } = renderHook(
        () => useDatabaseSnapshot(hookId, dbRef),
        {
          wrapper,
        },
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeInstanceOf(DataSnapshot);
      expect(result.current.data.exists()).toBe(true);
      expect(result.current.data.val()).toEqual({ foo: "bar" });
    });

    test("it subscribes to data snapshots", async () => {
      const hookId = genId();
      const dbRef = ref(database, genId());

      await set(dbRef, { foo: "bar" });

      const mock = jest.fn();
      const { result, waitFor, unmount } = renderHook(
        () =>
          useDatabaseSnapshot(
            hookId,
            dbRef,
            { subscribe: true },
            {
              onSuccess(snapshot) {
                mock(snapshot);
              },
            },
          ),
        {
          wrapper,
        },
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeInstanceOf(DataSnapshot);
      expect(result.current.data.exists()).toBe(true);
      expect(result.current.data.val()).toEqual({ foo: "bar" });

      await act(async () => {
        await update(dbRef, { bar: "baz" });
      });

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data.val()).toEqual({ foo: "bar", bar: "baz" });

      unmount();

      await act(async () => {
        await update(dbRef, { foo: "baz" });
      });

      expect(mock.mock.calls.length).toBe(2);
    });
    test("it should not unsubscribe if there is still a hook listening", async () => {
      const hookId = genId();
      const dbRef = ref(database, genId());

      await set(push(dbRef), 123);

      const mock1 = jest.fn();
      const mock2 = jest.fn();
      const hook1 = renderHook(
        () =>
          useDatabaseSnapshot(
            hookId,
            dbRef,
            { subscribe: true },
            {
              onSuccess(snapshot) {
                mock1(snapshot);
              },
            },
          ),
        {
          wrapper,
        },
      );
      const hook2 = renderHook(
        () =>
          useDatabaseSnapshot(
            hookId,
            dbRef,
            { subscribe: true },
            {
              onSuccess(snapshot) {
                mock2(snapshot);
              },
            },
          ),
        {
          wrapper,
        },
      );

      await hook1.waitFor(() => hook1.result.current.isSuccess);
      await hook2.waitFor(() => hook2.result.current.isSuccess);
      hook1.unmount();

      await act(async () => {
        await set(push(dbRef), "baz");
      });

      await hook2.waitFor(() => hook2.result.current.isSuccess, {
        timeout: 5000,
      });

      expect(mock1.mock.calls.length).toBe(1);

      expect(mock2.mock.calls.length).toBe(2);
    });
  });

  describe("useDatabaseValue", () => {
    test("it returns null if ref doesn't exist", async () => {
      const hookId = genId();
      const dbRef = ref(database, "foo");

      const { result, waitFor } = renderHook(
        () => useDatabaseValue(hookId, dbRef),
        {
          wrapper,
        },
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeNull();
    });

    test("it returns data if exists", async () => {
      const hookId = genId();
      const dbRef = ref(database, genId());

      await set(dbRef, 10);

      const { result, waitFor } = renderHook(
        () => useDatabaseValue<number>(hookId, dbRef),
        {
          wrapper,
        },
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBe(10);
    });

    test("it returns modified data", async () => {
      const hookId = genId();
      const dbRef = ref(database, genId());

      await set(dbRef, 10);

      const { result, waitFor } = renderHook(
        () =>
          useDatabaseValue<number, string>(hookId, dbRef, undefined, {
            select(value) {
              return value.toString();
            },
          }),
        {
          wrapper,
        },
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBe("10");
    });

    test("it returns if ref is a list value", async () => {
      const hookId = genId();
      const dbRef = ref(database, genId());

      await Promise.all([
        await set(push(dbRef), "foo"),
        await set(push(dbRef), 123),
      ]);

      const { result, waitFor } = renderHook(
        () => useDatabaseValue(hookId, dbRef, { toArray: true }),
        {
          wrapper,
        },
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual(["foo", 123]);
    });

    test("it returns if ref is a list value with a nested list", async () => {
      const hookId = genId();
      const dbRef = ref(database, genId());
      const nestedRef = push(dbRef);

      await Promise.all([
        await set(push(dbRef), "foo"),
        await set(push(nestedRef), "foo"),
        await set(push(nestedRef), 123),
      ]);

      const { result, waitFor } = renderHook(
        () => useDatabaseValue(hookId, dbRef, { toArray: true }),
        {
          wrapper,
        },
      );

      await waitFor(() => result.current.isSuccess);

      // Nested ref comes first
      expect(result.current.data).toEqual([["foo", 123], "foo"]);
    });

    test("it returns an object if no array option is set", async () => {
      const hookId = genId();
      const dbRef = ref(database, genId());

      await set(dbRef, { foo: "bar", bar: "baz" });

      const { result, waitFor } = renderHook(
        () => useDatabaseValue(hookId, dbRef, undefined),
        {
          wrapper,
        },
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual({ foo: "bar", bar: "baz" });
    });

    test("it subscribes to data changes", async () => {
      const hookId = genId();
      const dbRef = ref(database, genId());

      await Promise.all([
        await set(push(dbRef), "foo"),
        await set(push(dbRef), 123),
      ]);

      const mock = jest.fn();
      const { result, waitFor, unmount } = renderHook(
        () =>
          useDatabaseValue(
            hookId,
            dbRef,
            { subscribe: true, toArray: true },
            {
              onSuccess(snapshot) {
                mock(snapshot);
              },
            },
          ),
        {
          wrapper,
        },
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual(["foo", 123]);

      await act(async () => {
        await set(push(dbRef), "baz");
      });

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual(["foo", 123, "baz"]);

      unmount();

      await act(async () => {
        await remove(dbRef);
      });

      expect(mock.mock.calls.length).toBe(2);
    });

    test("it should not unsubscribe if there is still a hook listening", async () => {
      const hookId = genId();
      const dbRef = ref(database, genId());

      await set(push(dbRef), 123);

      const mock1 = jest.fn();
      const mock2 = jest.fn();
      const hook1 = renderHook(
        () =>
          useDatabaseValue(
            hookId,
            dbRef,
            { subscribe: true },
            {
              onSuccess(data) {
                mock1(data);
              },
            },
          ),
        {
          wrapper,
        },
      );
      const hook2 = renderHook(
        () =>
          useDatabaseValue(
            hookId,
            dbRef,
            { subscribe: true },
            {
              onSuccess(data) {
                mock2(data);
              },
            },
          ),
        {
          wrapper,
        },
      );

      await hook1.waitFor(() => hook1.result.current.isSuccess);
      await hook2.waitFor(() => hook2.result.current.isSuccess);
      hook1.unmount();

      await act(async () => {
        await set(push(dbRef), "baz");
      });

      await hook2.waitFor(() => hook2.result.current.isSuccess, {
        timeout: 5000,
      });

      expect(mock1.mock.calls.length).toBe(1);

      expect(mock2.mock.calls.length).toBe(2);
    });
  });
});

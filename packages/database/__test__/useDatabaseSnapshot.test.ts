import React from "react";
import { QueryClient } from "react-query";
import { renderHook } from "@testing-library/react-hooks";
import { genId, init } from "./helpers";
import { useDatabaseSnapshot, useDatabaseValue } from "../src";
import { act } from "react-test-renderer";
import {
  FirebaseDatabaseTypes
} from "@react-native-firebase/database";

describe("Database", () => {
  let client: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let database: FirebaseDatabaseTypes.Module;

  beforeEach(async () => {
    const config = await init();
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
      const dbRef = database.ref("foo");

      const { result, waitFor } = renderHook(
        () => useDatabaseSnapshot(hookId, dbRef),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data.exists()).toBe(false);
    });

    test("it returns a valid snapshot with data", async () => {
      const hookId = genId();
      const dbRef = database.ref(genId());

      await dbRef.set({ foo: "bar" });

      const { result, waitFor } = renderHook(
        () => useDatabaseSnapshot(hookId, dbRef),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data.exists()).toBe(true);
      expect(result.current.data.val()).toEqual({ foo: "bar" });
    });

    test("it subscribes to data snapshots", async () => {
      const hookId = genId();
      const dbRef = database.ref(genId());

      await dbRef.set({ foo: "bar" });

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
            }
          ),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data.exists()).toBe(true);
      expect(result.current.data.val()).toEqual({ foo: "bar" });

      await act(async () => {
        await dbRef.update({ bar: "baz" });
      });

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data.val()).toEqual({ foo: "bar", bar: "baz" });

      unmount();

      await act(async () => {
        await dbRef.update({ foo: "baz" });
      });

      expect(mock.mock.calls.length).toBe(2);
    });
  });

  describe("useDatabaseValue", () => {
    test("it returns null if ref doesn't exist", async () => {
      const hookId = genId();
      const dbRef = database.ref("foo");

      const { result, waitFor } = renderHook(
        () => useDatabaseValue(hookId, dbRef),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeNull();
    });

    test("it returns data if exists", async () => {
      const hookId = genId();
      const dbRef = database.ref(genId());

      await dbRef.set(10);

      const { result, waitFor } = renderHook(
        () => useDatabaseValue<number>(hookId, dbRef),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBe(10);
    });

    test("it returns modified data", async () => {
      const hookId = genId();
      const dbRef = database.ref(genId());

      await dbRef.set(10);

      const { result, waitFor } = renderHook(
        () =>
          useDatabaseValue<number, string>(hookId, dbRef, undefined, {
            select(value) {
              return value.toString();
            },
          }),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBe("10");
    });

    test("it returns if ref is a list value", async () => {
      const hookId = genId();
      const dbRef = database.ref(genId());

      await Promise.all([
        await dbRef.push().set("foo"),
        await dbRef.push().set(123),
      ]);

      const { result, waitFor } = renderHook(
        () => useDatabaseValue(hookId, dbRef, { toArray: true }),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual(["foo", 123]);
    });

    test("it returns if ref is a list value with a nested list", async () => {
      const hookId = genId();
      const dbRef = database.ref(genId());
      const nestedRef = dbRef.push();

      await Promise.all([
        await dbRef.push().set("foo"),
        await nestedRef.push().set("foo"),
        await nestedRef.push().set(123),
      ]);

      const { result, waitFor } = renderHook(
        () => useDatabaseValue(hookId, dbRef, { toArray: true }),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      // Nested ref comes first
      expect(result.current.data).toEqual([["foo", 123], "foo"]);
    });

    test("it returns an object if no array option is set", async () => {
      const hookId = genId();
      const dbRef = database.ref(genId());

      await dbRef.set({ foo: "bar", bar: "baz" });

      const { result, waitFor } = renderHook(
        () => useDatabaseValue(hookId, dbRef, undefined),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual({ foo: "bar", bar: "baz" });
    });

    test("it subscribes to data changes", async () => {
      const hookId = genId();
      const dbRef = database.ref(genId());

      await Promise.all([
        await dbRef.push().set("foo"),
        await dbRef.push().set(123),
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
            }
          ),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual(["foo", 123]);

      await act(async () => {
        await dbRef.push().set("baz");
      });

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual(["foo", 123, "baz"]);

      unmount();

      await act(async () => {
        await dbRef.remove();
      });

      expect(mock.mock.calls.length).toBe(2);
    });
  });
});

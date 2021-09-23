import React from "react";
import { QueryClient } from "react-query";
import { renderHook } from "@testing-library/react-hooks";
import { genId, init } from "./helpers";
import {
  useDatabaseRemoveMutation,
  useDatabaseSetMutation,
  useDatabaseTransactionMutation,
  useDatabaseUpdateMutation,
} from "../src";
import { act } from "react-test-renderer";
import { Database, ref, set } from "@firebase/database";
import { get } from "firebase/database";

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

  describe("useDatabaseSetMutation", () => {
    test("it sets data", async () => {
      const dbRef = ref(database, genId());

      const { result, waitFor } = renderHook(
        () => useDatabaseSetMutation<number>(dbRef),
        {
          wrapper,
        }
      );

      act(() => {
        result.current.mutate(1337);
      });

      await waitFor(() => result.current.isSuccess);

      const snapshot = await get(dbRef);
      expect(snapshot.val()).toBe(1337);
    });

    test("it sets data with priority", async () => {
      const dbRef = ref(database, genId());

      const { result, waitFor } = renderHook(
        () => useDatabaseSetMutation<number>(dbRef, { priority: 10 }),
        {
          wrapper,
        }
      );

      act(() => {
        result.current.mutate(1339);
      });

      await waitFor(() => result.current.isSuccess);

      const snapshot = await get(dbRef);
      expect(snapshot.val()).toBe(1339);
      expect(snapshot.priority).toBe(10);
    });
  });

  describe("useDatabaseUpdateMutation", () => {
    test("it updates data", async () => {
      const dbRef = ref(database, genId());

      await set(dbRef, { foo: "bar", bar: { baz: 123 } });

      const { result } = renderHook(() => useDatabaseUpdateMutation(dbRef), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          ben: "boop",
          "bar/baz": "123",
        });
      });

      const snapshot = await get(dbRef);
      expect(snapshot.val()).toEqual({
        foo: "bar",
        bar: { baz: "123" },
        ben: "boop",
      });
    });
  });

  describe("useDatabaseRemoveMutation", () => {
    test("it removes data", async () => {
      const dbRef = ref(database, genId());

      await set(dbRef, { foo: "bar" });

      const { result, waitFor } = renderHook(
        () => useDatabaseRemoveMutation(dbRef),
        {
          wrapper,
        }
      );

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      const snapshot = await get(dbRef);
      expect(snapshot.exists()).toBe(false);
    });
  });

  describe("useDatabaseTransactionMutation", () => {
    test("it performs a transaction", async () => {
      const dbRef = ref(database, genId());

      await set(dbRef, { foo: 10 });

      // await new Promise<void>((r) => {
      //   onValue(dbRef, () => r(), {
      //     onlyOnce: true,
      //   });
      // });

      const { result } = renderHook(
        () =>
          useDatabaseTransactionMutation<{ foo: number }>(dbRef, (data) => {
            if (data) {
              data.foo++;
            }
            return data;
          }),
        {
          wrapper,
        }
      );

      await act(async () => {
        await result.current.mutateAsync();
      });

      const snapshot = await get(dbRef);
      expect(snapshot.val().foo).toBe(11);
    });
  });
});

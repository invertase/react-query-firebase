import React from "react";
import { QueryClient } from "react-query";
import { renderHook, act } from "@testing-library/react-hooks";
import {
  addDoc,
  collection,
  CollectionReference,
  DocumentSnapshot,
  Firestore,
  loadBundle,
  orderBy,
  query,
  QuerySnapshot,
} from "firebase/firestore";

import bundles from "./bundles";
import { genId, init, wipe } from "./helpers";
import {
  useFirestoreQuery,
  useFirestoreQueryData,
  namedQuery,
} from "../src/useFirestoreQuery";

describe("useFirestoreQuery", () => {
  let client: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let firestore: Firestore;

  beforeEach(() => {
    const config = init();
    client = config.client;
    wrapper = config.wrapper;
    firestore = config.firestore;
  });

  describe("useFirestoreQuery", () => {
    test("it returns a QuerySnapshot", async () => {
      const hookId = genId();
      const id = genId();
      const ref = collection(firestore, id);

      const { result, waitFor } = renderHook(
        () => useFirestoreQuery(hookId, ref),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeDefined();
      expect(result.current.data).toBeInstanceOf(QuerySnapshot);
      const snapshot = result.current.data;
      expect(snapshot!.size).toBe(0);
    });

    test("it returns a QuerySnapshot using a data cache source", async () => {
      const hookId = genId();
      const id = genId();
      const ref = collection(firestore, id);

      await addDoc(ref, { foo: "bar" });

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreQuery(hookId, ref, {
            source: "cache",
          }),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess);

      const snapshot = result.current.data;
      expect(snapshot!.metadata.fromCache).toBe(true);
    });

    test("it returns a QuerySnapshot using a data server source", async () => {
      const hookId = genId();
      const id = genId();
      const ref = collection(firestore, id);

      await addDoc(ref, { foo: "bar" });

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreQuery(hookId, ref, {
            source: "server",
          }),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess);

      const snapshot = result.current.data;
      expect(snapshot!.metadata.fromCache).toBe(false);
    });

    test("it overrides DocumentData generic", async () => {
      const hookId = genId();

      type Foo = {
        bar: number;
      };

      // Quick cast a reference.
      const id = genId();
      const ref = collection(firestore, id) as CollectionReference<Foo>;

      await addDoc(ref, { bar: 123 });

      const { result, waitFor } = renderHook(
        () => useFirestoreQuery(hookId, ref),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      const snapshot = result.current.data;
      expect(snapshot!.size).toBe(1);
      expect(snapshot!.docs[0].data().bar).toBe(123);
      // @ts-expect-error
      expect(snapshot.docs[0].data().baz).toBe(undefined);
    });

    test("it overrides ReturnType generic", async () => {
      const hookId = genId();

      type Foo = {
        bar: number;
      };

      type Bar = {
        bar: string;
      };

      // Quick cast a reference.
      const id = genId();
      const ref = collection(firestore, id) as CollectionReference<Foo>;

      await addDoc(ref, { bar: 123 });

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreQuery<Foo, Bar>(hookId, ref, undefined, {
            select(snapshot) {
              return {
                bar: snapshot.docs[0].data().bar.toString(),
              };
            },
          }),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      const data = result.current.data;
      expect(data!.bar).toBe("123");
      // @ts-expect-error
      expect(data.baz).toBe(undefined);
    });

    test("it subscribes and unsubscribes to data events", async () => {
      const hookId = genId();

      const id = genId();
      const col = collection(firestore, id);
      const ref = query(col, orderBy("order", "asc"));
      const mock = jest.fn();

      const { result, waitFor, unmount } = renderHook(
        () =>
          useFirestoreQuery(
            hookId,
            ref,
            {
              subscribe: true,
            },
            {
              onSuccess(snapshot) {
                if (snapshot.size > 0) {
                  mock(snapshot);
                }
              },
            }
          ),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      await act(async () => {
        await addDoc(col, { foo: "bar", order: 0 });
        await addDoc(col, { foo: "baz", order: 1 });
      });

      // Trigger an  unmount - this should unsubscribe the listener.
      unmount();

      // Trigger an update to ensure the mock wasn't called again.
      await act(async () => {
        await addDoc(col, { foo: "..." });
      });

      // getDocs, onSubscribe, onSubscribe (add), onSubscribe (add),
      expect(mock).toHaveBeenCalledTimes(2);

      const call1 = mock.mock.calls[0][0];
      const call2 = mock.mock.calls[1][0];
      expect(call1.size).toEqual(1);
      expect(call1.docs[0].data().foo).toEqual("bar");
      expect(call2.size).toEqual(2);

      // New should be first, previous last.
      expect(call2.docs[0].data().foo).toEqual("bar");
      expect(call2.docs[1].data().foo).toEqual("baz");
    });

    test("it re-subscribes when the ref changes", async () => {
      const hookId = genId();

      const id1 = `1-${genId()}`;
      const id2 = `2-${genId()}`;

      const ref1 = collection(firestore, id1);
      const ref2 = collection(firestore, id2);

      await addDoc(ref1, { foo: "bar" });
      await addDoc(ref2, { foo: "bar" });

      const mock = jest.fn();
      const { result, waitFor, unmount, rerender, waitForNextUpdate } =
        renderHook<
          {
            reference: CollectionReference;
          },
          any
        >(
          ({ reference }) =>
            useFirestoreQuery(
              hookId,
              reference,
              {
                subscribe: true,
              },
              {
                onSuccess(snapshot) {
                  mock(snapshot);
                },
              }
            ),
          {
            wrapper: (props) => wrapper({ children: props.children }),
            initialProps: {
              reference: ref1,
            },
          }
        );

      await waitFor(() => result.current.isSuccess);

      function getDoc(value: any): DocumentSnapshot {
        return value as DocumentSnapshot;
      }

      expect(mock.mock.calls[0][0].size).toBe(1);

      // Get call
      expect(getDoc(mock.mock.calls[0][0].docs[0]).ref.parent.id).toBe(id1);

      // Subscribe 1
      expect(getDoc(mock.mock.calls[1][0].docs[0]).ref.parent.id).toBe(id1);

      rerender({ reference: ref2 });

      await waitForNextUpdate();

      expect(getDoc(mock.mock.calls[2][0].docs[0]).ref.parent.id).toBe(id2);

      // Trigger an  unmount - this should unsubscribe the listener.
      unmount();

      expect(mock).toHaveBeenCalledTimes(3);
    });
  });

  describe("useFirestoreQueryData", () => {
    test("it returns document data and not a snapshot", async () => {
      const hookId = genId();

      const id = genId();
      const ref = collection(firestore, id);

      await addDoc(ref, { foo: "bar" });

      const { result, waitFor } = renderHook(
        () => useFirestoreQueryData(hookId, ref),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual(
        expect.arrayContaining([{ foo: "bar" }])
      );
    });

    test("it overrides the select option", async () => {
      const hookId = genId();

      const id = genId();
      const ref = collection(firestore, id);

      await addDoc(ref, { foo: "bar" });

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreQueryData(hookId, ref, undefined, {
            select() {
              return [
                {
                  baz: "ben",
                },
              ];
            },
          }),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual(
        expect.arrayContaining([{ baz: "ben" }])
      );
    });
  });

  // TODO(ehesp): Test works, but Jest throws an "unimplemented" error when calling loadBundle.
  // The test passes but this error throws causing the test to fail.
  xdescribe("useFirestoreQuery Named Query", () => {
    it("uses a named query fn", async () => {
      const bundle = "named-bundle-test-1";
      await loadBundle(firestore, bundles[bundle]);

      const hookId = genId();

      const { result, waitFor } = renderHook(
        () => useFirestoreQueryData(hookId, namedQuery(firestore, bundle)),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess);
      expect(result.current.data!.length).toBeGreaterThan(0);
    });
  });
});

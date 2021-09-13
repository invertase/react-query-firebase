import React from "react";
import { QueryClient, QueryClientProvider, setLogger } from "react-query";
import { renderHook, act } from "@testing-library/react-hooks";
import {
  doc,
  DocumentReference,
  DocumentSnapshot,
  Firestore,
  setDoc,
} from "firebase/firestore";

import {
  useFirestoreDocument,
  useFirestoreDocumentData,
} from "../src/useFirestoreDocument";
import { init, wipe } from "./helpers";

describe("useFirestoreDocumentX", () => {
  let client: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let firestore: Firestore;

  beforeEach(() => {
    const config = init();
    client = config.client;
    wrapper = config.wrapper;
    firestore = config.firestore;
  });

  afterEach(async () => {
    client.clear();
    await wipe();
  });

  describe("useFirestoreDocument", () => {
    test("it returns a DocumentSnapshot", async () => {
      const id = "bar";
      const ref = doc(firestore, "foo", id);

      const { result, waitFor } = renderHook(
        () => useFirestoreDocument("foo", ref),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeDefined();
      expect(result.current.data).toBeInstanceOf(DocumentSnapshot);
      const snapshot = result.current.data;
      expect(snapshot.id).toBe(id);
    });

    xtest("it returns a DocumentSnapshot using a data cache source", async () => {
      const id = "bar";
      const ref = doc(firestore, "foo", id);

      await setDoc(ref, { foo: "bar" });

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreDocument("foo", ref, {
            source: "cache",
          }),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess);

      const snapshot = result.current.data;
      expect(snapshot.metadata.fromCache).toBe(true);
    });

    test("it returns a DocumentSnapshot using a data server source", async () => {
      const id = "bar";
      const ref = doc(firestore, "foo", id);

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreDocument("foo", ref, {
            source: "server",
          }),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess);

      const snapshot = result.current.data;
      expect(snapshot.metadata.fromCache).toBe(false);
    });

    test("it overrides DocumentData generic", async () => {
      const id = "bar";

      type Foo = {
        bar: number;
      };

      // Quick cast a reference.
      const ref = doc(firestore, "foo", id) as DocumentReference<Foo>;

      await setDoc(ref, { bar: 123 });

      const { result, waitFor } = renderHook(
        () => useFirestoreDocument("foo", ref),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      const snapshot = result.current.data;
      expect(snapshot.data().bar).toBe(123);
      // @ts-expect-error
      expect(snapshot.data().baz).toBe(undefined);
    });

    test("it overrides ReturnType generic", async () => {
      const id = "bar";

      type Foo = {
        bar: number;
      };

      type Bar = {
        bar: string;
      };

      // Quick cast a reference.
      const ref = doc(firestore, "foo", id) as DocumentReference<Foo>;

      await setDoc(ref, { bar: 123 });

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreDocument<Foo, Bar>("foo", ref, undefined, {
            select(snapshot) {
              return {
                bar: snapshot.data().bar.toString(),
              };
            },
          }),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      const data = result.current.data;
      expect(data.bar).toBe("123");
      // @ts-expect-error
      expect(data.baz).toBe(undefined);
    });

    test("it subscribes and unsubscribes to data events", async () => {
      const id = "bar";

      const ref = doc(firestore, "foo", id);
      const mock = jest.fn();
      const { result, waitFor, unmount } = renderHook(
        () =>
          useFirestoreDocument(
            "foo",
            ref,
            {
              subscribe: true,
            },
            {
              onSuccess(snapshot) {
                if (snapshot.exists()) {
                  mock(snapshot.data());
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
        await setDoc(ref, { foo: "bar" });
        await setDoc(ref, { foo: "baz" });
      });

      // Trigger an  unmount - this should unsubscribe the listener.
      unmount();

      // Trigger an update to ensure the mock wasn't called again.
      await act(async () => {
        await setDoc(ref, { foo: "..." });
      });

      expect(mock).toHaveBeenCalledTimes(2);
      expect(mock.mock.calls[0][0]).toEqual({ foo: "bar" });
      expect(mock.mock.calls[1][0]).toEqual({ foo: "baz" });
    });

    test("it re-subscribes when the ref changes", async () => {
      const id1 = "bar";
      const id2 = "baz";

      const ref1 = doc(firestore, "foo", id1);
      const ref2 = doc(firestore, "foo", id2);

      const mock = jest.fn();
      const { result, waitFor, unmount, rerender, waitForNextUpdate } =
        renderHook<
          {
            reference: DocumentReference;
          },
          any
        >(
          ({ reference }) =>
            useFirestoreDocument(
              "foo",
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

      // Get call
      expect(mock.mock.calls[0][0].id).toBe(id1);

      // Subscription call
      expect(mock.mock.calls[1][0].id).toBe(id1);

      rerender({ reference: ref2 });

      await waitForNextUpdate();

      expect(mock.mock.calls[2][0].id).toBe(id2);

      // Trigger an  unmount - this should unsubscribe the listener.
      unmount();

      expect(mock).toHaveBeenCalledTimes(3);
    });
  });

  describe("useFirestoreDocumentData", () => {
    test("it returns document data and not a snapshot", async () => {
      const id = "bar";
      const ref = doc(firestore, "foo", id);

      await setDoc(ref, { foo: "bar" });

      const { result, waitFor } = renderHook(
        () => useFirestoreDocumentData("foo", ref),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeDefined();
      expect(result.current.data).toEqual({ foo: "bar" });
    });

    test("it overrides the select option", async () => {
      const id = "bar";
      const ref = doc(firestore, "foo", id);

      await setDoc(ref, { foo: "bar" });

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreDocumentData("foo", ref, undefined, {
            select() {
              return {
                baz: "ben",
              };
            },
          }),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeDefined();
      expect(result.current.data).toEqual({ baz: "ben" });
    });
  });
});

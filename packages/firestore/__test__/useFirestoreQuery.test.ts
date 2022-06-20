/*
 * Copyright (c) 2016-present Invertase Limited & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this library except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import * as React from "react";
import { renderHook, act } from "@testing-library/react-hooks";
import {
  addDoc,
  collection,
  CollectionReference,
  DocumentSnapshot,
  Firestore,
  limit,
  loadBundle,
  orderBy,
  query,
  QuerySnapshot,
  startAfter,
} from "firebase/firestore";

import bundles from "./bundles";
import { genId, init } from "./helpers";
import {
  useFirestoreQuery,
  useFirestoreQueryData,
  namedQuery,
  useFirestoreInfiniteQuery,
  useFirestoreInfiniteQueryData,
} from "../src";
import axios from "axios";

describe("useFirestoreQuery", () => {
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let firestore: Firestore;

  beforeEach(async () => {
    const config = init();
    await axios.delete(
      `http://localhost:8080/emulator/v1/projects/${config.projectId}/databases/(default)/documents`
    );
    wrapper = config.wrapper;
    firestore = config.firestore;
  });

  describe("useFirestoreQuery", () => {
    test("it returns a QuerySnapshot", async () => {
      const hookId = genId();
      const id = genId();
      const ref = collection(firestore, "tests", id, id);

      const { result, waitFor } = renderHook(
        () => useFirestoreQuery(hookId, ref),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(result.current.data).toBeDefined();
      expect(result.current.data).toBeInstanceOf(QuerySnapshot);
      const snapshot = result.current.data;
      expect(snapshot!.size).toBe(0);
    });

    test("it returns a QuerySnapshot using a data cache source", async () => {
      const hookId = genId();
      const id = genId();
      const ref = collection(firestore, "tests", id, id);

      await act(async () => {
        addDoc(ref, { foo: "bar" });
      });

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreQuery(hookId, ref, {
            source: "cache",
          }),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      const snapshot = result.current.data;
      expect(snapshot!.metadata.fromCache).toBe(true);
    });

    test("it returns a QuerySnapshot using a data server source", async () => {
      const hookId = genId();
      const id = genId();
      const ref = collection(firestore, "tests", id, id);

      await act(async () => {
        addDoc(ref, { foo: "bar" });
      });

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreQuery(hookId, ref, {
            source: "server",
          }),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      const snapshot = result.current.data;
      expect(snapshot!.metadata.fromCache).toBe(false);
    });

    test("it overrides DocumentData generic", async () => {
      const hookId = genId();

      type Foo = {
        bar: number;
      };

      // Quick cast a reference.

      const ref = collection(
        firestore,
        "tests",
        genId(),
        genId()
      ) as CollectionReference<Foo>;

      await act(async () => {
        await addDoc(ref, { bar: 123 });
      });

      const { result, waitFor } = renderHook(
        () => useFirestoreQuery(hookId, ref),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

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

      const id = genId();
      const ref = collection(
        firestore,
        "tests",
        id,
        id
      ) as CollectionReference<Foo>;

      await act(async () => {
        await addDoc(ref, { bar: 123 });
      });

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

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      const data = result.current.data;
      expect(data!.bar).toBe("123");
      // @ts-expect-error
      expect(data.baz).toBe(undefined);
    });

    test("it subscribes and unsubscribes to data events", async () => {
      const hookId = genId();
      const id = genId();
      const col = collection(firestore, "tests", id, id);
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

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

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

      const call1 = mock.mock.calls[0][0];
      const call2 = mock.mock.calls[1][0];
      expect(mock).toHaveBeenCalledTimes(2);
      expect(call1.size).toEqual(1);
      expect(call1.docs[0].data().foo).toEqual("bar");
      expect(call2.size).toEqual(2);

      // New should be first, previous last.
      expect(call2.docs[0].data().foo).toEqual("bar");
      expect(call2.docs[1].data().foo).toEqual("baz");
    });

    test("it re-subscribes when the key changes", async () => {
      const hookId1 = genId();
      const hookId2 = genId();

      const id1 = `1-${genId()}`;
      const id2 = `2-${genId()}`;

      const ref1 = collection(firestore, "tests", id1, id1);
      const ref2 = collection(firestore, "tests", id2, id2);

      await act(async () => {
        await addDoc(ref1, { foo: "bar" });
        await addDoc(ref2, { foo: "bar" });
      });

      const mock = jest.fn();
      const { result, waitFor, unmount, rerender } = renderHook<
        {
          id: string;
          reference: CollectionReference;
        },
        any
      >(
        ({ id, reference }) =>
          useFirestoreQuery(
            id,
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
            id: hookId1,
            reference: ref1,
          },
        }
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      function getDoc(value: any): DocumentSnapshot {
        return value as DocumentSnapshot;
      }

      expect(mock.mock.calls[0][0].size).toBe(1);

      // Subscribe 1
      expect(getDoc(mock.mock.calls[0][0].docs[0]).ref.parent.id).toBe(id1);

      rerender({ id: hookId2, reference: ref2 });

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(getDoc(mock.mock.calls[1][0].docs[0]).ref.parent.id).toBe(id2);

      // Trigger an  unmount - this should unsubscribe the listener.
      unmount();

      expect(mock).toHaveBeenCalledTimes(2);
    });

    test("it should not unsubscribe if there is still a hook listening", async () => {
      const hookId1 = genId();
      const id = genId();
      const col = collection(firestore, "tests", id, id);

      const mock1 = jest.fn();
      const mock2 = jest.fn();
      const hook1 = renderHook<
        {
          id: string;
          reference: CollectionReference;
        },
        any
      >(
        ({ id, reference }) =>
          useFirestoreQuery(
            id,
            reference,
            {
              subscribe: true,
            },
            {
              onSuccess(snapshot) {
                mock1(snapshot);
              },
            }
          ),
        {
          wrapper: (props) => wrapper({ children: props.children }),
          initialProps: {
            id: hookId1,
            reference: col,
          },
        }
      );
      const hook2 = renderHook<
        {
          id: string;
          reference: CollectionReference;
        },
        any
      >(
        ({ id, reference }) =>
          useFirestoreQuery(
            id,
            reference,
            {
              subscribe: true,
            },
            {
              onSuccess(snapshot) {
                mock2(snapshot);
              },
            }
          ),
        {
          wrapper: (props) => wrapper({ children: props.children }),
          initialProps: {
            id: hookId1,
            reference: col,
          },
        }
      );

      await hook1.waitFor(() => hook1.result.current.isSuccess, {
        timeout: 5000,
      });

      hook1.unmount();

      await act(async () => {
        await addDoc(col, { foo: "baz" });
      });

      await hook2.waitFor(() => hook2.result.current.isSuccess, {
        timeout: 5000,
      });

      expect(mock1.mock.calls.length).toBe(1);

      expect(mock2.mock.calls.length).toBe(2);
    });
  });

  describe("useFirestoreQueryData", () => {
    test("it returns document data and not a snapshot", async () => {
      const hookId = genId();
      const id = genId();
      const ref = collection(firestore, "tests", id, id);

      await act(async () => {
        await addDoc(ref, { foo: "bar" });
      });

      const { result, waitFor } = renderHook(
        () => useFirestoreQueryData(hookId, ref),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(result.current.data).toEqual(
        expect.arrayContaining([{ foo: "bar" }])
      );
    });

    test("it overrides the select option", async () => {
      const hookId = genId();
      const id = genId();
      const ref = collection(firestore, "tests", id, id);

      await act(async () => {
        await addDoc(ref, { foo: "bar" });
      });

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

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(result.current.data).toEqual(
        expect.arrayContaining([{ baz: "ben" }])
      );
    });

    test("it provides the id key", async () => {
      const hookId = genId();
      const id = genId();
      const ref = collection(firestore, "tests", id, id);

      await act(async () => {
        await addDoc(ref, { foo: "bar" });
      });

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreQueryData<"id">(hookId, ref, {
            idField: "id",
          }),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(result.current.data[0].foo).toEqual("bar");
      expect(typeof result.current.data[0].id).toBe("string");
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

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });
      expect(result.current.data!.length).toBeGreaterThan(0);
    });
  });

  describe("useFirestoreInfiniteQuery hook", () => {
    beforeEach(async () => {
      const config = init();
      await axios.delete(
        `http://localhost:8080/emulator/v1/projects/${config.projectId}/databases/(default)/documents`
      );
    });
    test("it returns a snapshot", async () => {
      const hookId = genId();
      const id = genId();
      const ref = collection(firestore, "tests", id, id);

      await act(async () => {
        await Promise.all([
          addDoc(ref, { foo: 1 }),
          addDoc(ref, { foo: 2 }),
          addDoc(ref, { foo: 3 }),
          addDoc(ref, { foo: 4 }),
          addDoc(ref, { foo: 5 }),
        ]);
      });

      const q = query(ref, limit(2));

      const mock = jest.fn();
      const { result, waitFor } = renderHook(
        () =>
          useFirestoreInfiniteQuery(hookId, q, (snapshot) => {
            mock(snapshot);
            return undefined;
          }),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(result.current.data.pages.length).toBe(1); // QuerySnapshot
      expect(result.current.data.pages[0].docs.length).toBe(2);

      await act(async () => {
        await result.current.fetchNextPage();
      });

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      const snapshot: QuerySnapshot = mock.mock.calls[0][0];
      expect(snapshot.size).toBe(2);
      expect(result.current.hasNextPage).toBe(false);
    });

    test("it loads the next page of snapshots", async () => {
      const hookId = genId();
      const id = genId();

      const ref = collection(firestore, "tests", id, id);

      await act(async () => {
        await Promise.all([
          addDoc(ref, { foo: 1 }),
          addDoc(ref, { foo: 2 }),
          addDoc(ref, { foo: 3 }),
          addDoc(ref, { foo: 4 }),
          addDoc(ref, { foo: 5 }),
        ]);
      });

      const q = query(ref, limit(2));

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreInfiniteQuery(hookId, q, (snapshot) => {
            return query(q, startAfter(snapshot.docs[1]));
          }),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(result.current.data.pages.length).toBe(1); // QuerySnapshot
      expect(result.current.data.pages[0].docs.length).toBe(2);

      await act(async () => {
        await result.current.fetchNextPage();
      });

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(result.current.data.pages.length).toBe(2);
      expect(result.current.data.pages[1].docs.length).toBe(2);
    });
  });

  describe("useFirestoreInfiniteQueryData hook", () => {
    test("it returns a data", async () => {
      const hookId = genId();
      const id = genId();

      const ref = collection(firestore, "tests", id, id);

      await act(async () => {
        await Promise.all([
          addDoc(ref, { foo: 1 }),
          addDoc(ref, { foo: 2 }),
          addDoc(ref, { foo: 3 }),
          addDoc(ref, { foo: 4 }),
          addDoc(ref, { foo: 5 }),
        ]);
      });

      const q = query(ref, limit(2), orderBy("foo"));

      const mock = jest.fn();
      const { result, waitFor } = renderHook(
        () =>
          useFirestoreInfiniteQueryData(hookId, q, (data) => {
            mock(data);
            return undefined;
          }),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(result.current.data.pages.length).toBe(1);
      expect(result.current.data.pages[0].length).toBe(2);
      expect(result.current.data.pages[0]).toEqual([{ foo: 1 }, { foo: 2 }]);

      await act(async () => {
        await result.current.fetchNextPage();
      });

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      const data: any = mock.mock.calls[0][0];
      expect(data.length).toBe(2);
      expect(result.current.hasNextPage).toBe(false);
    });

    test("it loads the next page of data", async () => {
      const hookId = genId();
      const id = genId();
      const ref = collection(firestore, "tests", id, id);

      await act(async () => {
        await Promise.all([
          addDoc(ref, { foo: 1 }),
          addDoc(ref, { foo: 2 }),
          addDoc(ref, { foo: 3 }),
          addDoc(ref, { foo: 4 }),
          addDoc(ref, { foo: 5 }),
        ]);
      });

      const q = query(ref, limit(2), orderBy("foo"));

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreInfiniteQueryData(hookId, q, () => {
            return query(q, startAfter(2));
          }),
        { wrapper }
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(result.current.data.pages[0].length).toBe(2);
      expect(result.current.data.pages[0]).toEqual([{ foo: 1 }, { foo: 2 }]);

      await act(async () => {
        await result.current.fetchNextPage();
      });

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(result.current.data.pages.length).toBe(2);
      expect(result.current.data.pages[1].length).toBe(2);
      expect(result.current.data.pages[1]).toEqual([{ foo: 3 }, { foo: 4 }]);
    });

    test("it provides the idField", async () => {
      const hookId = genId();
      const id = genId();
      const ref = collection(firestore, "tests", id, id);

      await act(async () => {
        await Promise.all([
          addDoc(ref, { foo: 1 }),
          addDoc(ref, { foo: 2 }),
          addDoc(ref, { foo: 3 }),
          addDoc(ref, { foo: 4 }),
          addDoc(ref, { foo: 5 }),
        ]);

        const q = query(ref, limit(2), orderBy("foo"));

        const { result, waitFor } = renderHook(
          () =>
            useFirestoreInfiniteQueryData<"id">(
              hookId,
              q,
              () => {
                return query(q, startAfter(2));
              },
              {
                idField: "id",
              }
            ),
          { wrapper }
        );

        await waitFor(() => result.current.isSuccess, { timeout: 5000 });

        expect(result.current.data.pages[0].length).toBe(2);
        expect(result.current.data.pages[0][0].foo).toEqual(1);
        expect(typeof result.current.data.pages[0][0].id).toBe("string");
        expect(result.current.data.pages[0][1].foo).toEqual(2);
        expect(typeof result.current.data.pages[0][1].id).toBe("string");

        await act(async () => {
          await result.current.fetchNextPage();
        });

        await waitFor(() => result.current.isSuccess, { timeout: 5000 });

        expect(result.current.data.pages.length).toBe(2);
        expect(result.current.data.pages[1].length).toBe(2);
        expect(result.current.data.pages[1][0].foo).toEqual(3);
        expect(typeof result.current.data.pages[1][0].id).toBe("string");
        expect(result.current.data.pages[1][1].foo).toEqual(4);
        expect(typeof result.current.data.pages[1][1].id).toBe("string");
      });
    });
  });
});

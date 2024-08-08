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
  doc,
  DocumentReference,
  DocumentSnapshot,
  Firestore,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { useFirestoreDocument, useFirestoreDocumentData } from "../src";
import { genId, init } from "./helpers";
import axios from "axios";

describe("useFirestoreDocument and useFirestoreDocumentData", () => {
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let firestore: Firestore;

  beforeEach(async () => {
    const config = init();
    await axios.delete(
      `http://localhost:8080/emulator/v1/projects/${config.projectId}/databases/(default)/documents`,
    );
    wrapper = config.wrapper;
    firestore = config.firestore;
  });
  describe("useFirestoreDocumentData", () => {
    test("it returns document data and not a snapshot", async () => {
      const hookId = genId();
      const id = genId();
      const ref = doc(firestore, "tests", id);

      await act(() => setDoc(ref, { foo: "bar" }));

      const { result, waitFor } = renderHook(
        () => useFirestoreDocumentData(hookId, ref),
        { wrapper },
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(result.current.data).toBeDefined();
      expect(result.current.data).toEqual({ foo: "bar" });
    });

    test("it overrides the select option", async () => {
      const hookId = genId();
      const id = genId();
      const ref = doc(firestore, "tests", id);

      await setDoc(ref, { foo: "bar" });

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreDocumentData(hookId, ref, undefined, {
            select() {
              return {
                baz: "ben",
              };
            },
          }),
        { wrapper },
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(result.current.data).toBeDefined();
      expect(result.current.data).toEqual({ baz: "ben" });
    });

    test("it provides the id key", async () => {
      const hookId = genId();
      const id = genId();
      const ref = doc(firestore, "tests", id);

      await setDoc(ref, { foo: "bar" });

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreDocumentData<"id">(hookId, ref, {
            idField: "id",
          }),
        { wrapper },
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(result.current.data).toBeDefined();
      expect(result.current.data).toEqual({ foo: "bar", id });
    });
  });
  describe("useFirestoreDocument hook", () => {
    test("it returns a DocumentSnapshot", async () => {
      const hookId = genId();
      const id = genId();
      const ref = doc(firestore, "tests", id);

      const { result, waitFor } = renderHook(
        () => useFirestoreDocument(hookId, ref),
        { wrapper },
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(result.current.data).toBeDefined();
      expect(result.current.data).toBeInstanceOf(DocumentSnapshot);
      const snapshot = result.current.data;
      expect(snapshot.id).toBe(id);
    });

    // TODO(ehesp): cached query never resolves.
    xtest("it returns a DocumentSnapshot using a data cache source", async () => {
      const hookId = genId();
      const id = genId();
      const ref = doc(firestore, "tests", id);

      await setDoc(ref, { foo: "bar" });

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreDocument(hookId, ref, {
            source: "cache",
          }),
        { wrapper },
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      const snapshot = result.current.data;
      expect(snapshot.metadata.fromCache).toBe(true);
    });

    test("it returns a DocumentSnapshot using a data server source", async () => {
      const hookId = genId();
      const id = genId();
      const ref = doc(firestore, "tests", id);

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreDocument(hookId, ref, {
            source: "server",
          }),
        { wrapper },
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      const snapshot = result.current.data;
      expect(snapshot.metadata.fromCache).toBe(false);
    });

    test("it overrides DocumentData generic", async () => {
      const hookId = genId();
      const id = genId();

      type Foo = {
        bar: number;
      };

      // Quick cast a reference.
      const ref = doc(firestore, "tests", id) as DocumentReference<Foo>;

      await setDoc(ref, { bar: 123 });

      const { result, waitFor } = renderHook(
        () => useFirestoreDocument(hookId, ref),
        {
          wrapper,
        },
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      const snapshot = result.current.data;

      expect(snapshot.data().bar).toBe(123);
      // @ts-expect-error
      expect(snapshot.data().baz).toBe(undefined);
    });

    test("it overrides ReturnType generic", async () => {
      const hookId = genId();
      const id = genId();

      type Foo = {
        bar: number;
      };

      type Bar = {
        bar: string;
      };

      // Quick cast a reference.
      const ref = doc(firestore, "tests", id) as DocumentReference<Foo>;

      await setDoc(ref, { bar: 123 });

      const { result, waitFor } = renderHook(
        () =>
          useFirestoreDocument<Foo, Bar>(hookId, ref, undefined, {
            select(snapshot) {
              return {
                bar: snapshot.data().bar.toString(),
              };
            },
          }),
        {
          wrapper,
        },
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      const data = result.current.data;
      expect(data.bar).toBe("123");
      // @ts-expect-error
      expect(data.baz).toBe(undefined);
    });

    test("it subscribes and unsubscribes to data events", async () => {
      const hookId = genId();
      const id = genId();
      const ref = doc(firestore, "tests", id);

      const mock = jest.fn();
      const { result, waitFor, unmount } = renderHook(
        () =>
          useFirestoreDocument(
            hookId,
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
            },
          ),
        {
          wrapper,
        },
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

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
      const hookId1 = genId();
      const hookId2 = genId();
      const id1 = `1-${genId()}`;
      const id2 = `2-${genId()}`;

      const ref1 = doc(firestore, "tests", id1);
      const ref2 = doc(firestore, "tests", id2);

      const mock = jest.fn();
      const { result, waitFor, unmount, rerender } = renderHook<
        {
          id: string;
          reference: DocumentReference;
        },
        any
      >(
        ({ id, reference }) =>
          useFirestoreDocument(
            id,
            reference,
            {
              subscribe: true,
            },
            {
              onSuccess(snapshot) {
                mock(snapshot);
              },
            },
          ),
        {
          wrapper: (props) => wrapper({ children: props.children }),
          initialProps: {
            id: hookId1,
            reference: ref1,
          },
        },
      );

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      // Subscription call
      expect(mock.mock.calls[0][0].id).toBe(id1);

      rerender({ id: hookId2, reference: ref2 });

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(mock.mock.calls[1][0].id).toBe(id2);

      // Trigger an  unmount - this should unsubscribe the listener.
      unmount();

      expect(mock).toHaveBeenCalledTimes(2);
    });

    test("two hooks instances, same ref and id", async () => {
      const hookId1 = genId();
      const id1 = `1-${genId()}`;

      const ref1 = doc(firestore, "tests", id1);

      await act(async () => {
        await setDoc(ref1, { foo: "..." });
      });

      const mock1 = jest.fn();
      const mock2 = jest.fn();

      const hook1 = renderHook<
        {
          id: string;
          reference: DocumentReference;
        },
        any
      >(
        ({ id, reference }) =>
          useFirestoreDocument(
            id,
            reference,
            {
              subscribe: true,
            },
            {
              onSuccess(snapshot) {
                mock1(snapshot);
              },
            },
          ),
        {
          wrapper: (props) => wrapper({ children: props.children }),
          initialProps: {
            id: hookId1,
            reference: ref1,
          },
        },
      );
      const hook2 = renderHook<
        {
          id: string;
          reference: DocumentReference;
        },
        any
      >(
        ({ id, reference }) =>
          useFirestoreDocument(
            id,
            reference,
            {
              subscribe: true,
            },
            {
              onSuccess(snapshot) {
                mock2(snapshot);
              },
            },
          ),
        {
          wrapper: (props) => wrapper({ children: props.children }),
          initialProps: {
            id: hookId1,
            reference: ref1,
          },
        },
      );

      await hook1.waitFor(() => hook1.result.current.isSuccess, {
        timeout: 5000,
      });

      hook1.unmount();

      // act here to trigger doc event
      await act(async () => {
        await updateDoc(ref1, { foo: "baz" });
      });

      await hook2.waitFor(() => hook2.result.current.isSuccess);

      // Subscription call
      expect(mock2.mock.calls[0][0].id).toBe(id1);

      hook2.unmount();

      // act again
      await act(async () => {
        await updateDoc(ref1, { foo: "bar" });
      });

      // await hook2.waitFor(() => hook2.result.current.isSuccess);

      expect(mock1.mock.calls.length).toBe(1);

      expect(mock2.mock.calls.length).toBe(2);
    });
    // runs fine individually when match statement is set up, fails when ran with other tests, not sure why.
    test.skip("it should propagate the error when not subscribing", async () => {
      const hookId = genId();
      const id = genId();
      const doc1 = doc(firestore, "noread", id);
      const { result, waitFor } = renderHook(
        () =>
          useFirestoreDocument(hookId, doc1, {
            subscribe: false,
          }),
        {
          wrapper,
        },
      );
      await waitFor(() => result.current.isError, { timeout: 5000 });
    });
  });
});

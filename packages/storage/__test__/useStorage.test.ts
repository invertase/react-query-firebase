import React from "react";
import { QueryClient } from "react-query";
import { renderHook } from "@testing-library/react-hooks";
import {
  ref,
  updateMetadata,
  uploadString,
  FirebaseStorage,
  uploadBytes,
} from "firebase/storage";
import { genId, init } from "./helpers";
import {
  useStorageList,
  useStorageObjectDownloadURL,
  useStorageObjectMetadata,
} from "../src";

const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21]);

describe("Storage", () => {
  let client: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let storage: FirebaseStorage;

  beforeEach(() => {
    const config = init();
    client = config.client;
    wrapper = config.wrapper;
    storage = config.storage;
  });

  afterEach(async () => {
    client.clear();
  });

  describe("useStorageObjectMetadata", () => {
    test.only("it returns metadata", async () => {
      const hookId = genId();
      const sRef = ref(storage, "some-child");

      await uploadBytes(sRef, bytes);
      await updateMetadata(sRef, {
        customMetadata: {
          foo: "bar",
        },
      });

      const { result, waitFor } = renderHook(
        () => useStorageObjectMetadata(hookId, sRef),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data.customMetadata).toEqual({ foo: "bar" });
    });
  });

  describe("useStorageObjectDownloadURL", () => {
    test("it returns a download url", async () => {
      const hookId = genId();
      const sRef = ref(storage, genId());

      await uploadString(sRef, "foo");

      const { result, waitFor } = renderHook(
        () => useStorageObjectDownloadURL(hookId, sRef),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toBeInstanceOf(String);
      expect(result.current.data.length).toBeGreaterThan(5);
    });
  });

  describe("useStorageList", () => {
    test("it returns a full list", async () => {
      const hookId = genId();
      const f1 = genId();
      const f2 = genId();
      const f3 = genId();

      const sRef = ref(storage, `${genId()}`);

      await Promise.all([
        uploadString(sRef, f1),
        uploadString(sRef, f2),
        uploadString(sRef, f3),
      ]);

      const { result, waitFor } = renderHook(
        () => useStorageList(hookId, sRef),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data.items.length).toBe(3);
      expect(result.current.data.nextPageToken).toBeNull();
      expect(result.current.data.items[0].name).toBe(f1);
      expect(result.current.data.items[1].name).toBe(f2);
      expect(result.current.data.items[2].name).toBe(f3);
    });

    test("it returns a paginated list", async () => {
      const hookId = genId();
      const f1 = genId();
      const f2 = genId();
      const f3 = genId();

      const sRef = ref(storage, `${genId()}`);

      await Promise.all([
        uploadString(sRef, f1),
        uploadString(sRef, f2),
        uploadString(sRef, f3),
      ]);

      const { result, waitFor, rerender } = renderHook<
        { pageToken: string | null },
        any
      >(
        ({ pageToken }) =>
          useStorageList(hookId, sRef, {
            maxResults: 1,
            pageToken,
          }),
        {
          wrapper: (props) => wrapper({ children: props.children }),
          initialProps: {
            pageToken: null,
          },
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data.items.length).toBe(1);
      expect(result.current.data.nextPageToken).toBeInstanceOf(String);
      expect(result.current.data.items[0].name).toBe(f1);

      rerender({ pageToken: result.current.data.nextPageToken });

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data.items.length).toBe(1);
      expect(result.current.data.nextPageToken).toBeInstanceOf(String);
      expect(result.current.data.items[0].name).toBe(f2);
    });
  });
});

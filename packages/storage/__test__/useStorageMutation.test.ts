import React from "react";
import { QueryClient } from "react-query";
import { renderHook } from "@testing-library/react-hooks";
import {
  ref,
  FirebaseStorage,
  uploadBytes,
  getMetadata,
} from "firebase/storage";
import { genId, init } from "./helpers";
import { useStorageDeleteObject, useStorageUpload } from "../src";
import { act } from "react-test-renderer";

const bytes = new Uint8Array([
  0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21,
]);

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

  describe("useStorageDeleteObject", () => {
    test("it deletes an object", async () => {
      const sRef = ref(storage, "some-child");

      await uploadBytes(sRef, bytes);

      const { result, waitFor } = renderHook(
        () => useStorageDeleteObject(sRef),
        {
          wrapper,
        }
      );

      await act(async () => {
        await result.current.mutateAsync();
      });

      await waitFor(() => result.current.isSuccess);

      try {
        await getMetadata(sRef);
        fail("The object should be deleted");
      } catch (e) {
        expect(e.code).toEqual("storage/object-not-found");
      }
    });
  });

  describe("useStorageUpload", () => {
    test("it uploads a string", async () => {
      const id = genId();
      const sRef = ref(storage, id);

      const { result, waitFor } = renderHook(() => useStorageUpload(sRef), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          value: "Foo!",
          format: "raw",
          metadata: {
            customMetadata: {
              foo: "bar",
            },
          },
        });
      });

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data.ref.name).toEqual(id);
      expect(result.current.data.metadata.customMetadata.foo).toEqual("bar");
    });

    test("it uploads bytes", async () => {
      const id = genId();
      const sRef = ref(storage, id);

      const { result, waitFor } = renderHook(() => useStorageUpload(sRef), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          value: bytes,
          metadata: {
            customMetadata: {
              foo: "bar",
            },
          },
        });
      });

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data.ref.name).toEqual(id);
      expect(result.current.data.metadata.customMetadata.foo).toEqual("bar");
    });
  });
});

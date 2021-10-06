import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from "react-query";
import {
  deleteObject,
  FullMetadata,
  SettableMetadata,
  StorageError,
  StorageReference,
  updateMetadata,
  uploadBytes,
  uploadBytesResumable,
  UploadMetadata,
  UploadResult,
  uploadString,
  UploadTaskSnapshot,
} from "firebase/storage";
import { useEffect, useRef, useState } from "react";
import { Unsubscribe } from "@firebase/util";

export function useStorageDeleteObject(
  ref: StorageReference,
  useMutationOptions?: UseMutationOptions<void, StorageError, void>
): UseMutationResult<void, StorageError, void> {
  return useMutation<void, StorageError, void>(() => {
    return deleteObject(ref);
  }, useMutationOptions);
}

export function useStorageUpdateMetadata(
  ref: StorageReference,
  useMutationOptions?: UseMutationOptions<
    FullMetadata,
    StorageError,
    SettableMetadata
  >
): UseMutationResult<FullMetadata, StorageError, SettableMetadata> {
  return useMutation<FullMetadata, StorageError, SettableMetadata>(
    (metadata) => {
      return updateMetadata(ref, metadata);
    },
    useMutationOptions
  );
}

export type UseStorageUploadStringMutationArgs = {
  value: string;
  format?: "raw" | "base64" | "base64url" | "data_url";
  metadata?: UploadMetadata;
};

export type UseStorageUploadBytesMutationArgs = {
  value: Blob | Uint8Array | ArrayBuffer;
  metadata?: UploadMetadata;
};

export type UseStorageUploadMutationArgs =
  | UseStorageUploadStringMutationArgs
  | UseStorageUploadBytesMutationArgs;

function isStringMutation(
  args: UseStorageUploadMutationArgs
): args is UseStorageUploadStringMutationArgs {
  return typeof args.value === "string";
}

export function useStorageUpload(
  ref: StorageReference,
  useMutationOptions?: UseMutationOptions<
    UploadResult,
    StorageError,
    UseStorageUploadMutationArgs
  >
): UseMutationResult<UploadResult, StorageError, UseStorageUploadMutationArgs> {
  return useMutation<UploadResult, StorageError, UseStorageUploadMutationArgs>(
    (args) => {
      if (isStringMutation(args)) {
        return uploadString(ref, args.value, args.format, args.metadata);
      }

      return uploadBytes(ref, args.value, args.metadata);
    },
    useMutationOptions
  );
}

export type UseStorageUploadResumableMutationArgs = {
  value: Blob | Uint8Array | ArrayBuffer;
  metadata?: UploadMetadata;
};

export function useStorageUploadResumable(
  ref: StorageReference,
  useMutationOptions?: UseMutationOptions<
    UploadResult,
    StorageError,
    UseStorageUploadMutationArgs
  >
): [
  UseMutationResult<UploadResult, Error, UseStorageUploadResumableMutationArgs>,
  UploadTaskSnapshot | null
] {
  const [snapshot, setSnapshot] = useState<UploadTaskSnapshot | null>(null);
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    unsubscribe.current?.();
  }, []);

  const mutation = useMutation<
    UploadResult,
    StorageError,
    UseStorageUploadResumableMutationArgs
  >(async ({ value, metadata }) => {
    const task = uploadBytesResumable(ref, value, metadata);

    unsubscribe.current = task.on("state_changed", {
      next(snapshot) {
        setSnapshot(snapshot);
      },
      error(error) {
        throw error;
      },
    });

    const finalSnapshot = await task;
    unsubscribe.current();
    return finalSnapshot;
  }, useMutationOptions);

  return [mutation, snapshot];
}

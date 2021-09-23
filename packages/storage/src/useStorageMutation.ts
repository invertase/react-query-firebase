import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import {
  deleteObject,
  FullMetadata,
  SettableMetadata,
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

export function useStorageDeleteMutation(
  ref: StorageReference,
  useMutationOptions?: UseMutationOptions<void, Error, void>
): UseMutationResult<void, Error, void> {
  return useMutation<void, Error, void>(() => {
    return deleteObject(ref);
  }, useMutationOptions);
}

export function useStorageUpdateMetadataMutation(
  ref: StorageReference,
  useMutationOptions?: UseMutationOptions<FullMetadata, Error, SettableMetadata>
): UseMutationResult<FullMetadata, Error, SettableMetadata> {
  return useMutation<FullMetadata, Error, SettableMetadata>((metadata) => {
    return updateMetadata(ref, metadata);
  }, useMutationOptions);
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

export function useStorageUploadMutation(
  ref: StorageReference,
  useMutationOptions?: UseMutationOptions<
    UploadResult,
    Error,
    UseStorageUploadMutationArgs
  >
): UseMutationResult<UploadResult, Error, UseStorageUploadMutationArgs> {
  return useMutation<UploadResult, Error, UseStorageUploadMutationArgs>(
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

export function useStorageUploadResumableMutation(
  key: QueryKey,
  ref: StorageReference,
  useQueryOptions?: UseQueryOptions<UploadTaskSnapshot, Error>,
  useMutationOptions?: UseMutationOptions<
    UploadResult,
    Error,
    UseStorageUploadMutationArgs
  >
): [
  UseQueryResult<UploadTaskSnapshot, Error>,
  UseMutationResult<UploadResult, Error, UseStorageUploadResumableMutationArgs>
] {
  const client = useQueryClient();
  const [snapshot, setSnapshot] = useState<UploadTaskSnapshot | null>(null);
  const unsubscribe = useRef<Unsubscribe>();

  useEffect(() => {
    unsubscribe.current?.();
  }, []);

  const query = useQuery<UploadTaskSnapshot, Error>({
    queryKey: key,
    queryFn: () => {
      return snapshot!;
    },
    enabled: !snapshot ? false : useQueryOptions?.enabled ?? true,
  });

  const mutation = useMutation<
    UploadResult,
    Error,
    UseStorageUploadResumableMutationArgs
  >(async ({ value, metadata }) => {
    const task = uploadBytesResumable(ref, value, metadata);

    unsubscribe.current = task.on("state_changed", {
      next(snapshot) {
        if (!snapshot) {
          setSnapshot(snapshot);
        } else {
          client.setQueryData<UploadTaskSnapshot>(key, snapshot);
        }
      },
      error(error) {
        throw error;
      },
    });

    const finalSnapshot = await task;
    unsubscribe.current();
    return finalSnapshot;
  }, useMutationOptions);

  return [query, mutation];
}

import { QueryKey, useQuery, UseQueryOptions } from "react-query";
import {
  FullMetadata,
  getDownloadURL,
  getMetadata,
  list,
  listAll,
  ListOptions,
  ListResult,
  StorageReference,
} from "firebase/storage";

export function useStorageList(
  key: QueryKey,
  ref: StorageReference,
  options?: ListOptions,
  useQueryOptions?: Omit<UseQueryOptions<ListResult, Error>, "queryFn">
) {
  return useQuery<ListResult, Error>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      if (
        options?.maxResults !== undefined ||
        typeof options?.pageToken === "string"
      ) {
        return list(ref, options);
      }

      return listAll(ref);
    },
  });
}

export function useStorageObjectMetadata(
  key: QueryKey,
  ref: StorageReference,
  useQueryOptions?: Omit<UseQueryOptions<FullMetadata, Error>, "queryFn">
) {
  return useQuery<FullMetadata, Error>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      return getMetadata(ref);
    },
  });
}

export function useStorageObjectDownloadURL(
  key: QueryKey,
  ref: StorageReference,
  useQueryOptions?: Omit<UseQueryOptions<string, Error>, "queryFn">
) {
  return useQuery<string, Error>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      return getDownloadURL(ref);
    },
  });
}

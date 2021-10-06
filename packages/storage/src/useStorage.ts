import {
  QueryKey,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import {
  FullMetadata,
  getDownloadURL,
  getMetadata,
  list,
  listAll,
  ListOptions,
  ListResult,
  StorageError,
  StorageReference,
} from "firebase/storage";

export function useStorageList(
  key: QueryKey,
  ref: StorageReference,
  options?: ListOptions,
  useQueryOptions?: Omit<UseQueryOptions<ListResult, StorageError>, "queryFn">
): UseQueryResult<ListResult, StorageError> {
  return useQuery<ListResult, StorageError>({
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
  useQueryOptions?: Omit<UseQueryOptions<FullMetadata, StorageError>, "queryFn">
): UseQueryResult<FullMetadata, StorageError> {
  return useQuery<FullMetadata, StorageError>({
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
  useQueryOptions?: Omit<UseQueryOptions<string, StorageError>, "queryFn">
): UseQueryResult<string, StorageError> {
  return useQuery<string, StorageError>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      return getDownloadURL(ref);
    },
  });
}

import { QueryKey, useQuery, UseQueryOptions } from "react-query";
import {
  fetchAndActivate,
  getAll,
  getValue,
  RemoteConfig,
  Value,
} from "firebase/remote-config";

export function useRemoteConfigValues(
  key: QueryKey,
  remoteConfig: RemoteConfig,
  useQueryOptions?: Omit<
    UseQueryOptions<Record<string, Value>, Error>,
    "queryFn"
  >
) {
  return useQuery({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      await fetchAndActivate(remoteConfig);
      return getAll(remoteConfig);
    },
  });
}

export function useRemoteConfigValue(
  key: QueryKey,
  remoteConfig: RemoteConfig,
  remoteKey: string,
  useQueryOptions?: Omit<UseQueryOptions<Value, Error>, "queryFn">
) {
  return useQuery({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      await fetchAndActivate(remoteConfig);
      return getValue(remoteConfig, remoteKey);
    },
  });
}

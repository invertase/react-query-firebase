import { useEffect, useRef, useState } from "react";
import {
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "react-query";
import { Auth, onIdTokenChanged, User } from "firebase/auth";
import {
  Completer,
  usePrevious,
  getClientKey,
} from "@react-query-firebase/utils";

export function useAuthUser(
  key: QueryKey,
  auth: Auth,
  useQueryOptions?: UseQueryOptions<User | null, Error>
) {
  const client = useQueryClient();
  const completer = useRef<Completer<User | null>>(new Completer());
  const app = auth.app.name;
  const newKey = getClientKey(key);
  const previousKey = usePrevious(getClientKey(key));

  const keyHasChanged = newKey !== previousKey;

  // If there is an auth user, add it straight away rather than waiting for the
  // listener to subscribe.
  if (!completer.current.complete && !!auth.currentUser) {
    completer.current.resolve(auth.currentUser);
  }

  useEffect(() => {
    completer.current = new Completer();
  }, [keyHasChanged]);

  useEffect(() => {
    return onIdTokenChanged(auth, (state) => {
      if (!completer.current.complete) {
        completer.current.resolve(auth.currentUser);
      } else {
        client.setQueryData<User | null>(key, state);
      }
    });
  }, [app, key]);

  return useQuery<User | null, Error>(
    key,
    () => {
      return completer.current.promise;
    },
    {
      ...(useQueryOptions || {}),
    }
  );
}

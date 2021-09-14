import { useEffect, useRef, useState } from "react";
import {
  QueryKey,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "react-query";
import { Auth, onIdTokenChanged, User } from "firebase/auth";

export function useAuthUser(
  key: QueryKey,
  auth: Auth,
  useQueryOptions?: UseQueryOptions<User | null, Error>
) {
  const client = useQueryClient();
  const initialUser = useRef<User | null>(auth.currentUser);
  const [ready, setReady] = useState<boolean>(!!initialUser.current);

  const app = auth.app.name;

  useEffect(() => {
    return onIdTokenChanged(auth, (state) => {
      if (!ready) {
        initialUser.current = state;
        setReady(true);
      } else {
        client.setQueryData<User | null>(key, state);
      }
    });
  }, [app, key]);

  return useQuery<User | null, Error>(
    key,
    () => {
      return initialUser.current;
    },
    {
      ...(useQueryOptions || {}),
      enabled: !ready ? false : useQueryOptions?.enabled ?? true,
    }
  );
}

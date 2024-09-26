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
import { QueryKey, UseQueryOptions, UseQueryResult } from "react-query";
import { Auth, AuthError, NextOrObserver, User } from "firebase/auth";
import { useSubscription } from "../../utils/src/useSubscription";

export function useAuthUser<R = User>(
  queryKey: QueryKey,
  auth: Auth,
  options: Omit<UseQueryOptions<User, AuthError, R>, "queryFn"> = {}
): UseQueryResult<R, AuthError> {
  const subscribeFn = (cb: NextOrObserver<User | null>) =>
    auth.onAuthStateChanged(cb);

  return useSubscription<User, AuthError, R>(
    queryKey,
    ["useAuthUser", queryKey],
    subscribeFn,
    options
  );
}

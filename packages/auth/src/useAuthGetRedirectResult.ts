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
import {
  QueryKey,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import {
  Auth,
  AuthError,
  UserCredential,
  getRedirectResult,
  PopupRedirectResolver,
} from "firebase/auth";

export function useAuthGetRedirectResult(
  key: QueryKey,
  auth: Auth,
  resolver?: PopupRedirectResolver,
  useQueryOptions?: Omit<
    UseQueryOptions<UserCredential | null, AuthError>,
    "queryFn"
  >
): UseQueryResult<UserCredential | null, AuthError> {
  return useQuery<UserCredential | null, AuthError>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      return getRedirectResult(auth, resolver);
    },
  });
}

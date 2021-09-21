import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "react-query";
import {
  Functions,
  httpsCallable,
  HttpsCallableOptions,
} from "firebase/functions";

export function useFunctionsQuery<
  RequestData = unknown,
  ResponseData = unknown,
  ModifiedData = ResponseData
>(
  key: QueryKey,
  functions: Functions,
  trigger: string,
  data?: RequestData | null,
  options?: HttpsCallableOptions,
  useQueryOptions?: Omit<
    UseQueryOptions<ResponseData, Error, ModifiedData>,
    "queryFn"
  >
) {
  return useQuery<ResponseData, Error, ModifiedData>({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    async queryFn() {
      const response = await httpsCallable<RequestData, ResponseData>(
        functions,
        trigger,
        options
      )(data);

      return response.data;
    },
  });
}

export function useFunctionsMutation<
  RequestData = unknown,
  ResponseData = unknown
>(
  functions: Functions,
  trigger: string,
  options?: HttpsCallableOptions,
  useMutationOptions?: UseMutationOptions<ResponseData, Error, RequestData>
) {
  return useMutation<ResponseData, Error, RequestData>(async (data) => {
    const response = await httpsCallable<RequestData, ResponseData>(
      functions,
      trigger,
      options
    )(data);

    return response.data;
  }, useMutationOptions);
}

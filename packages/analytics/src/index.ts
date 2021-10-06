import {
  Analytics,
  isSupported,
  logEvent,
  EventParams,
  AnalyticsCallOptions,
  setAnalyticsCollectionEnabled,
  setCurrentScreen,
  setUserId,
  setUserProperties,
  CustomParams,
} from "firebase/analytics";
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";

export function useAnalyticsIsSupported(
  key: QueryKey,
  useQueryOptions?: UseQueryOptions<boolean, Error>
): UseQueryResult<boolean, Error> {
  return useQuery({
    ...useQueryOptions,
    queryKey: useQueryOptions?.queryKey ?? key,
    queryFn() {
      return isSupported();
    },
  });
}

export function useAnalyticsSetCollectionEnabled(
  analytics: Analytics,
  useMutationOptions?: UseMutationOptions<void, Error, boolean>
): UseMutationResult<void, Error, boolean> {
  return useMutation(async (enabled) => {
    return setAnalyticsCollectionEnabled(analytics, enabled);
  }, useMutationOptions);
}

export function useAnalyticsSetCurrentScreen(
  analytics: Analytics,
  useMutationOptions?: UseMutationOptions<
    void,
    Error,
    { screenName: string; options?: AnalyticsCallOptions }
  >
): UseMutationResult<
  void,
  Error,
  { screenName: string; options?: AnalyticsCallOptions }
> {
  return useMutation(async ({ screenName, options }) => {
    return setCurrentScreen(analytics, screenName, options);
  }, useMutationOptions);
}

export function useAnalyticsSetUserId(
  analytics: Analytics,
  useMutationOptions?: UseMutationOptions<
    void,
    Error,
    { id: string; options?: AnalyticsCallOptions }
  >
): UseMutationResult<
  void,
  Error,
  { id: string; options?: AnalyticsCallOptions }
> {
  return useMutation(async ({ id, options }) => {
    return setUserId(analytics, id, options);
  }, useMutationOptions);
}

export function useAnalyticsSetUserProperties(
  analytics: Analytics,
  useMutationOptions?: UseMutationOptions<
    void,
    Error,
    { properties: CustomParams; options?: AnalyticsCallOptions }
  >
): UseMutationResult<
  void,
  Error,
  { properties: CustomParams; options?: AnalyticsCallOptions }
> {
  return useMutation(async ({ properties, options }) => {
    return setUserProperties(analytics, properties, options);
  }, useMutationOptions);
}

type LogEventArgs<K extends keyof AnalyticsEventMap> = {
  params?: AnalyticsEventMap[K];
  options?: AnalyticsCallOptions;
};

export function useAnalyticsLogEvent(
  analytics: Analytics,
  eventName: keyof AnalyticsEventMap,
  useMutationOptions?: UseMutationOptions<
    void,
    Error,
    void | LogEventArgs<typeof eventName>
  >
): UseMutationResult<void, Error, void | LogEventArgs<typeof eventName>> {
  return useMutation(async (args) => {
    return logEvent(
      analytics,
      eventName as string,
      args?.params,
      args?.options
    );
  }, useMutationOptions);
}

type CustomLogArgs = {
  params?: {
    [key: string]: any;
  };
  options?: AnalyticsCallOptions;
};

export function useAnalyticsCustomLogEvent(
  analytics: Analytics,
  eventName: string,
  useMutationOptions?: UseMutationOptions<void, Error, void | CustomLogArgs>
): UseMutationResult<void, Error, void | CustomLogArgs> {
  return useMutation(async (args) => {
    return logEvent(analytics, eventName, args?.params, args?.options);
  }, useMutationOptions);
}

export type AnalyticsEventMap = {
  add_payment_info: AnalyticsPaymentInfo;
  purchase: AnalyticsPurchaseOrRefund;
  refund: AnalyticsPurchaseOrRefund;
  screen_view: AnalyticsScreenView;
  search: AnalyticsSearchOrViewSearchResults;
  view_search_results: AnalyticsSearchOrViewSearchResults;
  select_content: AnalyticsSelectContent;
  select_item: AnalyticsSelectItem;
  select_promotion: AnalyticsPromotion;
  view_promotion: AnalyticsPromotion;
  set_checkout_option: AnalyticsSetCheckoutOption;
  share: AnalyticsShare;
  sign_up: AnalyticsSignUp;
  timing_complete: AnalyticsTimingComplete;
  add_shipping_info: AnalyticsAddShippingInfo;
  view_cart: AnalyticsViewCartItem;
  view_item: AnalyticsViewCartItem;
  view_item_list: AnalyticsViewItemList;
};

export type AnalyticsPaymentInfo = {
  coupon?: EventParams["coupon"];
  currency?: EventParams["currency"];
  items?: EventParams["items"];
  payment_type?: EventParams["payment_type"];
  value?: EventParams["value"];
  [key: string]: any;
};

export type AnalyticsPurchaseOrRefund = {
  value?: EventParams["value"];
  currency?: EventParams["currency"];
  transaction_id: EventParams["transaction_id"];
  tax?: EventParams["tax"];
  shipping?: EventParams["shipping"];
  items?: EventParams["items"];
  coupon?: EventParams["coupon"];
  affiliation?: EventParams["affiliation"];
  [key: string]: any;
};

export type AnalyticsScreenView = {
  firebase_screen: EventParams["firebase_screen"];
  firebase_screen_class: EventParams["firebase_screen_class"];
  [key: string]: any;
};

export type AnalyticsSearchOrViewSearchResults = {
  search_term?: EventParams["search_term"];
  [key: string]: any;
};

export type AnalyticsSelectContent = {
  content_type?: EventParams["content_type"];
  item_id?: EventParams["item_id"];
  [key: string]: any;
};

export type AnalyticsSelectItem = {
  items?: EventParams["items"];
  item_list_name?: EventParams["item_list_name"];
  item_list_id?: EventParams["item_list_id"];
  [key: string]: any;
};

export type AnalyticsPromotion = {
  items?: EventParams["items"];
  promotion_id?: EventParams["promotion_id"];
  promotion_name?: EventParams["promotion_name"];
  [key: string]: any;
};

export type AnalyticsSetCheckoutOption = {
  checkout_step?: EventParams["checkout_step"];
  checkout_option?: EventParams["checkout_option"];
  [key: string]: any;
};

export type AnalyticsShare = {
  method?: EventParams["method"];
  content_type?: EventParams["content_type"];
  item_id?: EventParams["item_id"];
  [key: string]: any;
};

export type AnalyticsSignUp = {
  method?: EventParams["method"];
  [key: string]: any;
};

export type AnalyticsTimingComplete = {
  method?: EventParams["method"];
  [key: string]: any;
};

export type AnalyticsAddShippingInfo = {
  coupon?: EventParams["coupon"];
  currency?: EventParams["currency"];
  items?: EventParams["items"];
  shipping_tier?: EventParams["shipping_tier"];
  value?: EventParams["value"];
  [key: string]: any;
};

export type AnalyticsViewCartItem = {
  currency?: EventParams["currency"];
  items?: EventParams["items"];
  value?: EventParams["value"];
  [key: string]: any;
};

export type AnalyticsViewItemList = {
  items?: EventParams["items"];
  item_list_name?: EventParams["item_list_name"];
  item_list_id?: EventParams["item_list_id"];
  [key: string]: any;
};

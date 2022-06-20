import React from "react";
import { QueryClient } from "react-query";
import { renderHook } from "@testing-library/react-hooks";
import { Functions } from "firebase/functions";
import { genId, init } from "./helpers";
import { useFunctionsCall, useFunctionsQuery } from "../src";
import { act } from "react-test-renderer";

describe("Authentication", () => {
  let client: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;
  let functions: Functions;

  beforeEach(() => {
    const config = init();
    client = config.client;
    wrapper = config.wrapper;
    functions = config.functions;
  });

  afterEach(async () => {
    client.clear();
  });

  describe("useFunctionsQuery", () => {
    // seems to run fine on its own but fails when run in all tests
    test.skip("it returns a valid response", async () => {
      const hookId = genId();

      const { result, waitFor } = renderHook(
        () => useFunctionsQuery(hookId, functions, "test"),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual({ response: null });
    });

    test("it accepts data", async () => {
      const hookId = genId();

      const foo = {
        bar: "baz",
      };

      const { result, waitFor } = renderHook(
        () => useFunctionsQuery(hookId, functions, "test", foo),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual({ response: foo });
    });

    test("it throw on invalid trigger", async () => {
      const hookId = genId();

      const { result, waitFor } = renderHook(
        () => useFunctionsQuery(hookId, functions, "foo"),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isError);

      expect(result.current.error).toBeDefined();
    });

    test("it requeries on key change", async () => {
      const hookId1 = genId();
      const hookId2 = genId();

      const data1 = { foo: "bar" };
      const data2 = { bar: "baz" };

      const { result, waitFor, rerender } = renderHook<
        {
          id: string;
          data: any;
        },
        any
      >(({ id, data }) => useFunctionsQuery(id, functions, "test", data), {
        wrapper: (props) => wrapper({ children: props.children }),
        initialProps: {
          id: hookId1,
          data: data1,
        },
      });

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual({ response: data1 });

      rerender({ id: hookId2, data: data2 });

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual({ response: data2 });
    });

    test("it handles specific types", async () => {
      const hookId = genId();

      type RequestData = {
        foo: string;
      };

      type ResponseData = {
        response: RequestData;
      };

      const foo: RequestData = {
        foo: "bar",
      };

      const { result, waitFor } = renderHook(
        () =>
          useFunctionsQuery<RequestData, ResponseData>(
            hookId,
            functions,
            "test",
            foo
          ),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data.response.foo).toEqual("bar");
      // @ts-expect-error
      expect(result.current.data.response.bar).toBeUndefined();
    });

    test("it handles custom return type", async () => {
      const hookId = genId();

      type RequestData = {
        foo: string;
      };

      type ResponseData = {
        response: RequestData;
      };

      const foo: RequestData = {
        foo: "bar",
      };

      const { result, waitFor } = renderHook(
        () =>
          useFunctionsQuery<RequestData, ResponseData, string>(
            hookId,
            functions,
            "test",
            foo,
            undefined,
            {
              select(data) {
                return data.response.foo;
              },
            }
          ),
        {
          wrapper,
        }
      );

      await waitFor(() => result.current.isSuccess);

      expect(result.current.data).toEqual("bar");
    });
  });

  describe("useFunctionsCall", () => {
    test("it calls the function", async () => {
      const mock = jest.fn();

      const { result, waitFor } = renderHook(
        () =>
          useFunctionsCall(functions, "test", undefined, {
            onSuccess(data) {
              mock(data);
            },
          }),
        { wrapper }
      );

      act(() => {
        result.current.mutate(123);
      });

      await waitFor(() => result.current.isSuccess, { timeout: 5000 });

      expect(mock.mock.calls[0][0]).toEqual({ response: 123 });
    });

    test("it throws when calling a bad function", async () => {
      const { result, waitFor } = renderHook(
        () => useFunctionsCall(functions, "foo"),
        { wrapper }
      );

      act(() => {
        result.current.mutate(123);
      });

      await waitFor(() => result.current.isError);

      expect(result.current.error).toBeDefined();
    });
  });
});

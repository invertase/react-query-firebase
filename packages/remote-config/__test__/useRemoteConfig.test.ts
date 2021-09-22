import React from "react";
import { QueryClient } from "react-query";
import { renderHook } from "@testing-library/react-hooks";
import { Functions } from "firebase/functions";
import { genId, init } from "./helpers";
import { useFunctionsMutation, useFunctionsQuery } from "../src";
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
});

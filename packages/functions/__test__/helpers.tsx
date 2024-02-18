import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initializeApp } from "firebase/app";
import { getFunctions } from "@firebase/functions";
import { connectFunctionsEmulator } from "firebase/functions";

let emulatorsStarted = false;

export function genId(): string {
  return Math.random().toString(32);
}

export function init(): any {
  const firebase = initializeApp({
    projectId: "test-project",
    apiKey: "foo",
  });

  const functions = getFunctions(firebase);

  if (!emulatorsStarted) {
    connectFunctionsEmulator(functions, "localhost", 5001);
    emulatorsStarted = true;
  }

  const client = new QueryClient({
    defaultOptions: {
      queries: {
        // ✅ turns retries off
        retry: false,
        cacheTime: 0,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      // ✅ no more errors on the console
      error: () => null,
    },
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return { client, wrapper, firebase, functions };
}

import React, { type ReactNode } from "react";
import { describe, expect, test, beforeEach } from "vitest";
import { useNamedQuery } from "./useNamedQuery";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { firestore, wipeFirestore } from "~/testing-utils";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useNamedQuery", () => {
  beforeEach(async () => await wipeFirestore());

  test("returns correct data for an existing named query", async () => {
    const { result } = renderHook(
      () =>
        useNamedQuery(firestore, "emptyCollectionQuery", {
          queryKey: ["named", "empty"],
        }),
      { wrapper }
    );

    await waitFor(async () => {});
  });
});

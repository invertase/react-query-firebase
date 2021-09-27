import React from "react";
import ReactDOM from "react-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import {
  useFunctionsQuery,
  useFunctionsMutation,
} from "@react-query-firebase/functions";
import { functions } from "./firebase";
import { useQueryClient } from "react-query";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
      <ReactQueryDevtools initialIsOpen />
    </QueryClientProvider>
  );
}

function Example() {
  const client = useQueryClient();
  const query = useFunctionsQuery("joke", functions, "getJoke");
  const mutation = useFunctionsMutation(functions, "getJoke", undefined, {
    onSuccess(joke) {
      client.setQueryData("joke", joke);
    },
  });

  if (query.isLoading) {
    return <div>Loading joke...</div>;
  }

  if (query.isError || mutation.isError) {
    console.error(query.error || mutation.error);
    return <div>Something went wrong!</div>;
  }

  const joke = query.data;

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: joke }} />
      <br />
      <button onClick={() => mutation.mutate()} disabled={mutation.isLoading}>
        {mutation.isLoading ? "Loading joke..." : "Load a new joke"}
      </button>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

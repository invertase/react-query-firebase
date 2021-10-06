import React from "react";
import ReactDOM from "react-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import {
  useFunctionsQuery,
  useFunctionsCall,
} from "@react-query-firebase/functions";
import { functions } from "./firebase";
import { useQueryClient } from "react-query";

const queryClient = new QueryClient();

function Example() {
  const client = useQueryClient();
  const query = useFunctionsQuery<void, string>("joke", functions, "getJoke");

  const mutation = useFunctionsCall(functions, "getJoke", undefined, {
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
      <div dangerouslySetInnerHTML={{ __html: joke || "" }} />
      <br />
      <button onClick={() => mutation.mutate(undefined)} disabled={mutation.isLoading}>
        {mutation.isLoading ? "Loading joke..." : "Load a new joke"}
      </button>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
      <ReactQueryDevtools initialIsOpen />
    </QueryClientProvider>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

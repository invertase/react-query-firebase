import React from "react";
import ReactDOM from "react-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import { signInAnonymously, signOut } from "firebase/auth";
import { useAuthUser } from "@react-query-firebase/auth";
import { auth } from "./firebase";

const queryClient = new QueryClient();

function Example() {
  const query = useAuthUser("user", auth);

  if (query.isLoading) {
    return <div />;
  }

  const user = query.data;

  if (!user) {
    return (
      <button onClick={() => signInAnonymously(auth)}>Please sign in</button>
    );
  }

  return (
    <div>
      <div>User ID: {user.uid}</div>
      <button onClick={() => signOut(auth)}>Sign Out</button>
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

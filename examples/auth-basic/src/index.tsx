import React from "react";
import ReactDOM from "react-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import { signInAnonymously, signOut } from "firebase/auth";
import { useAuthUser } from "@react-query-firebase/auth";
import { auth } from "./firebase";
import { useState } from "react";

const queryClient = new QueryClient();

function Foo() {
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
      <User />
      <button onClick={() => signOut(auth)}>Sign Out</button>
    </div>
  );
}

function User() {
  const query = useAuthUser("user", auth);

  return <div>{query.data!.uid}</div>;
}

function Example() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <h1>Example!</h1>
      <button onClick={() => setShow(($) => !$)}>Toggle</button>
      {show && <Foo />}
    </div>
  );

  // const query = useAuthUser("user", auth);

  // if (query.isLoading) {
  //   return <div />;
  // }

  // const user = query.data;

  // if (!user) {
  //   return (
  //     <button onClick={() => signInAnonymously(auth)}>Please sign in</button>
  //   );
  // }

  // return (
  //   <div>
  //     <div>User ID: {user.uid}</div>
  //     <button onClick={() => signOut(auth)}>Sign Out</button>
  //   </div>
  // );
}

export default function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
      <ReactQueryDevtools initialIsOpen />
    </QueryClientProvider>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

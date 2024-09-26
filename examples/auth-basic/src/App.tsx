import { useState } from "react";
import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useAuthUser } from "@react-query-firebase/auth";
import { auth } from "./firebase";
import { signInAnonymously, signOut } from "firebase/auth";

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <Example />
    </QueryClientProvider>
  );
}

function Foo() {
  const { data: user, isLoading, isError, error } = useAuthUser(["user"], auth);

  const handleSignIn = async () => {
    try {
      const userCredential = await signInAnonymously(auth);
      console.log("user", userCredential.user);
      console.log("Signed in anonymously");
    } catch (error) {
      console.error("Error signing in anonymously:", error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  if (!user) {
    return <button onClick={handleSignIn}>Please sign in</button>;
  }

  return (
    <div>
      <User />
      <button onClick={() => signOut(auth)}>Sign Out</button>
    </div>
  );
}

function User() {
  const {
    data: user,
    isLoading,
    isError,
    error,
    isPending,
  } = useAuthUser(["user"], auth);

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return <div>{user?.uid}</div>;
}

function Example() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <h1>React Query Firebase Example!</h1>
      <p>
        React Query hooks for managing asynchronous operations with Firebase.
      </p>
      <strong>
        ✨ Supports Authentication, Analytics, Firestore & Realtime Database.
      </strong>
      <div>
        <button onClick={() => setShow((prev) => !prev)}>Toggle</button>
        <div>{show && <Foo />}</div>
      </div>
    </div>
  );
}

export default App;
